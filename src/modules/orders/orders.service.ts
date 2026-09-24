import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query-dto.js';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface.js';
import { Order, User } from '../../database/entities.js';
import { UserRole } from '../../common/enums/index.js';
import {
  EntityNotFoundException,
  ForbiddenResourceException,
} from '../../common/errors/generic-domain.exception.js';
import { EventsRepository } from '../events/domain/ports/events-repository.port.js';
import { OrdersRepository } from './domain/ports/orders-repository.port.js';
import { MaxPerUserExceededException } from './domain/errors/orders.errors.js';
import { ReserveTicketDto } from './dto/reserve-ticket.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';

export interface IOrdersService {
  reserveTickets(
    eventId: string,
    tierId: string,
    user: User,
    dto: ReserveTicketDto,
  ): Promise<Order>;
  getOrderById(orderId: string, user: User): Promise<Order>;
  getMyOrders(
    user: User,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Order>>;
  payOrder(orderId: string, user: User, dto: PayOrderDto): Promise<Order>;
  cancelOrder(orderId: string, user: User): Promise<Order>;
  releaseExpiredOrders(): Promise<number>;
}

@Injectable()
export class OrdersService implements IOrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly eventsRepository: EventsRepository,
  ) {}

  async reserveTickets(
    eventId: string,
    tierId: string,
    user: User,
    dto: ReserveTicketDto,
  ): Promise<Order> {
    if (dto.idempotencyKey) {
      const existing = await this.ordersRepository.findByIdempotencyKey(
        dto.idempotencyKey,
      );
      if (existing) {
        return existing;
      }
    }

    const tier = await this.eventsRepository.findTierById(tierId);
    if (!tier || tier.eventId !== eventId) {
      throw new EntityNotFoundException(
        'Kategori / tier tiket tidak ditemukan pada event yang dituju.',
      );
    }

    const currentReserved =
      await this.ordersRepository.countUserReservedQuantityForTier(
        user.id,
        tierId,
      );

    if (currentReserved + dto.quantity > tier.maxPerUser) {
      throw new MaxPerUserExceededException(tier.maxPerUser);
    }

    // karena order akan tumbuh ke kuantitas yang besar, kita gunakan timestamp dan UUID untuk menghindari collision
    const timeSegment = Date.now().toString(36).toUpperCase();
    const randomSegment = randomUUID()
      .replaceAll('-', '')
      .slice(0, 6)
      .toUpperCase();
    const orderNumber = `ORD-${timeSegment}-${randomSegment}`;

    const totalAmount = Number(tier.price) * dto.quantity;
    // TODO: extract expiration time into const or helper?
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return this.ordersRepository.reserve({
      customerId: user.id,
      eventId,
      ticketTierId: tierId,
      quantity: dto.quantity,
      totalAmount,
      orderNumber,
      expiresAt,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  async getMyOrders(
    user: User,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Order>> {
    return this.ordersRepository.findByCustomerId(user.id, pagination);
  }

  async getOrderById(orderId: string, user: User): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new EntityNotFoundException('Pesanan', orderId);
    }

    if (user.role === UserRole.CUSTOMER && order.customerId !== user.id) {
      throw new ForbiddenResourceException(
        'Anda tidak memiliki otoritas untuk melihat pesanan ini.',
      );
    }

    return order;
  }

  async payOrder(
    orderId: string,
    user: User,
    dto: PayOrderDto,
  ): Promise<Order> {
    const order = await this.getOrderById(orderId, user);

    if (order.customerId !== user.id) {
      throw new ForbiddenResourceException(
        'Hanya pemesan terkait yang berhak melakukan pembayaran.',
      );
    }

    return this.ordersRepository.payOrder(orderId);
  }

  async cancelOrder(orderId: string, user: User): Promise<Order> {
    const order = await this.getOrderById(orderId, user);

    if (order.customerId !== user.id) {
      throw new ForbiddenResourceException(
        'Hanya pemesan terkait yang berhak membatalkan pesanan.',
      );
    }

    return this.ordersRepository.cancelOrder(orderId);
  }

  async releaseExpiredOrders(): Promise<number> {
    return this.ordersRepository.releaseExpiredOrders();
  }
}
