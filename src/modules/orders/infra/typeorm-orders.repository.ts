import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../entities/order.entity.js';
import { TicketTier } from '../../events/entities/ticket-tier.entity.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import {
  OrdersRepository,
  ReserveParams,
} from '../domain/ports/orders-repository.port.js';
import {
  InvalidOrderStatusException,
  OrderExpiredException,
  QuotaExceededException,
  SalesWindowClosedException,
} from '../domain/errors/orders.errors.js';
import { InvalidEventStateException } from '../../events/domain/errors/events.errors.js';
import { EntityNotFoundException } from '../../../common/errors/generic-domain.exception.js';
import {
  isCheckConstraint,
  isUniqueConstraint,
} from '../../../common/errors/postgres-error.helper.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query-dto.js';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../../common/interfaces/paginated-result.interface.js';
import {
  EventStatus,
  OrderStatus,
  TicketStatus,
} from '../../../common/enums/index.js';

@Injectable()
export class TypeOrmOrdersRepository extends OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(TicketTier)
    private readonly tierRepo: Repository<TicketTier>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async reserve(params: ReserveParams): Promise<Order> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const tier = await manager.findOne(TicketTier, {
          where: { id: params.ticketTierId },
          relations: { event: true },
        });

        if (!tier) {
          throw new EntityNotFoundException('Tier tiket tidak ditemukan.');
        }

        if (tier.event.status !== EventStatus.PUBLISHED) {
          throw new InvalidEventStateException(
            'Acara belum dipublikasikan atau sudah dibatalkan.',
          );
        }

        const now = new Date();
        if (now < tier.salesStart) {
          throw new SalesWindowClosedException(
            'Penjualan untuk tier tiket ini belum dibuka.',
          );
        }

        if (now > tier.salesEnd) {
          throw new SalesWindowClosedException(
            'Penjualan untuk tier tiket ini telah ditutup.',
          );
        }

        // atomic decrement biar aman dari race condition overselling
        const updateResult = await manager
          .createQueryBuilder()
          .update(TicketTier)
          .set({
            availableQuota: () => '"availableQuota" - :qty',
          })
          .where('id = :tierId AND "availableQuota" >= :qty', {
            tierId: params.ticketTierId,
            qty: params.quantity,
          })
          .execute();

        if (updateResult.affected === 0) {
          throw new QuotaExceededException(
            'Tiket habis atau kuota tidak mencukupi untuk jumlah yang diminta.',
          );
        }

        const order = manager.create(Order, {
          orderNumber: params.orderNumber,
          customerId: params.customerId,
          ticketTierId: params.ticketTierId,
          quantity: params.quantity,
          totalAmount: params.totalAmount,
          status: OrderStatus.PENDING_PAYMENT,
          expiresAt: params.expiresAt,
          idempotencyKey: params.idempotencyKey || null,
        });

        const savedOrder = await manager.save(order);
        tier.availableQuota -= params.quantity;
        savedOrder.tier = tier;
        savedOrder.tickets = [];
        return savedOrder;
      });
    } catch (error) {
      if (isCheckConstraint(error)) {
        throw new QuotaExceededException(
          'Tiket habis atau kuota tidak mencukupi untuk jumlah yang diminta.',
        );
      }
      if (isUniqueConstraint(error) && params.idempotencyKey) {
        const existing = await this.findByIdempotencyKey(params.idempotencyKey);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { id },
      relations: {
        customer: true,
        tier: {
          event: {
            organizer: true,
          },
        },
        tickets: true,
      },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { orderNumber },
      relations: {
        customer: true,
        tier: {
          event: true,
        },
        tickets: true,
      },
    });
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { idempotencyKey: key },
      relations: {
        tier: { event: true },
        tickets: true,
      },
    });
  }

  async findByCustomerId(
    customerId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Order>> {
    const [items, totalItems] = await this.orderRepo.findAndCount({
      where: { customerId },
      relations: {
        tier: {
          event: true,
        },
        tickets: true,
      },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.take,
    });

    return createPaginatedResult(
      items,
      totalItems,
      pagination.page,
      pagination.limit,
    );
  }

  async payOrder(orderId: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: {
          tier: { event: true },
          customer: true,
        },
      });

      if (!order) {
        throw new EntityNotFoundException('Pesanan tidak ditemukan.');
      }

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new InvalidOrderStatusException(
          'Pesanan tidak dalam status menunggu pembayaran (sudah dibayar atau dibatalkan).',
        );
      }

      if (new Date() > order.expiresAt) {
        throw new OrderExpiredException(
          'Waktu pembayaran pesanan telah kedaluwarsa.',
        );
      }

      order.status = OrderStatus.PAID;
      await manager.save(order);

      const tickets: Ticket[] = [];
      for (let i = 0; i < order.quantity; i++) {
        const ticket = manager.create(Ticket, {
          orderId: order.id,
          ticketTierId: order.ticketTierId,
          eventId: order.tier.eventId,
          ticketCode: this.generateTicketCode(),
          attendeeName: order.customer.fullName,
          pricePaid: order.tier.price,
          status: TicketStatus.ISSUED,
          issuedAt: new Date(),
          admittedAt: null,
        });
        tickets.push(ticket);
      }

      const savedTickets = await manager.save(tickets);
      order.tickets = savedTickets;
      return order;
    });
  }

  async cancelOrder(orderId: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: { tier: true },
      });

      if (!order) {
        throw new EntityNotFoundException('Pesanan tidak ditemukan.');
      }

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new InvalidOrderStatusException(
          'Hanya pesanan berstatus PENDING_PAYMENT yang dapat dibatalkan.',
        );
      }

      order.status = OrderStatus.CANCELLED;
      await manager.save(order);

      await manager
        .createQueryBuilder()
        .update(TicketTier)
        .set({
          availableQuota: () => '"availableQuota" + :qty',
        })
        .where('id = :tierId', {
          tierId: order.ticketTierId,
          qty: order.quantity,
        })
        .execute();

      return order;
    });
  }

  async countUserReservedQuantityForTier(
    customerId: string,
    ticketTierId: string,
  ): Promise<number> {
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.quantity), 0)', 'total')
      .where('order.customerId = :customerId', { customerId })
      .andWhere('order.ticketTierId = :tierId', { tierId: ticketTierId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID],
      })
      .getRawOne();

    return parseInt(result?.total ?? '0', 10) || 0;
  }

  async releaseExpiredOrders(): Promise<number> {
    const result = await this.dataSource.query<{ count: string }[]>(
      `
      WITH expired AS (
        UPDATE "orders"
        SET status = $1
        WHERE status = $2 AND "expiresAt" < NOW()
        RETURNING "ticketTierId", quantity
      ),
      summed AS (
        SELECT "ticketTierId", SUM(quantity)::int AS total_qty
        FROM expired
        GROUP BY "ticketTierId"
      ),
      tier_update AS (
        UPDATE "ticket_tiers" t
        SET "availableQuota" = t."availableQuota" + s.total_qty
        FROM summed s
        WHERE t.id = s."ticketTierId"
      )
      SELECT COUNT(*)::text AS count FROM expired;
      `,
      [OrderStatus.EXPIRED, OrderStatus.PENDING_PAYMENT],
    );

    return parseInt(result[0]?.count ?? '0', 10) || 0;
  }

  private generateTicketCode(): string {
    const dateSegment = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSegment = randomUUID()
      .replaceAll('-', '')
      .slice(0, 6)
      .toUpperCase();
    return `TIK-${dateSegment}-${randomSegment}`;
  }
}
