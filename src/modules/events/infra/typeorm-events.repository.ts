import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isUniqueConstraint } from '../../../common/errors/postgres-error.helper.js';
import { Event } from '../entities/event.entity.js';
import { TicketTier } from '../entities/ticket-tier.entity.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import {
  EventsRepository,
  EventReport,
  FindEventsFilter,
  CreateEventData,
  UpdateEventData,
  CreateTicketTierData,
  UpdateTicketTierData,
} from '../domain/ports/events-repository.port.js';
import {
  DuplicateTierNameException,
  InvalidTierQuotaException,
  TicketAlreadyUsedException,
  TicketVoidException,
} from '../domain/errors/events.errors.js';
import { EntityNotFoundException } from '../../../common/errors/generic-domain.exception.js';
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
export class TypeOrmEventsRepository extends EventsRepository {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(TicketTier)
    private readonly tierRepo: Repository<TicketTier>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async findEvents(
    pagination: PaginationQueryDto,
    filter?: FindEventsFilter,
  ): Promise<PaginatedResult<Event>> {
    const qb = this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.tiers', 'tier');

    if (filter?.status) {
      qb.andWhere('event.status = :status', { status: filter.status });
    }

    if (filter?.organizerId) {
      qb.andWhere('event.organizerId = :organizerId', {
        organizerId: filter.organizerId,
      });
    }

    if (pagination.search) {
      qb.andWhere('(event.title ILIKE :search OR event.venue ILIKE :search)', {
        search: `%${pagination.search}%`,
      });
    }

    qb.orderBy('event.eventDate', 'ASC')
      .skip(pagination.skip)
      .take(pagination.take);

    const [items, totalItems] = await qb.getManyAndCount();

    return createPaginatedResult(
      items,
      totalItems,
      pagination.page,
      pagination.limit,
    );
  }

  async findById(id: string): Promise<Event | null> {
    return this.eventRepo.findOne({
      where: { id },
      relations: {
        organizer: true,
        tiers: true,
      },
      order: {
        tiers: {
          price: 'ASC',
        },
      },
    });
  }

  async createEvent(
    data: CreateEventData,
    tiers?: CreateTicketTierData[],
  ): Promise<Event> {
    return this.dataSource.transaction(async (manager) => {
      const event = manager.create(Event, {
        ...data,
        status: data.status ?? EventStatus.PUBLISHED,
      });
      const savedEvent = await manager.save(event);

      if (tiers && tiers.length > 0) {
        // TODO: investigate this, apakah ini bakal jadi N+1?
        const tierEntities = tiers.map((t) =>
          manager.create(TicketTier, {
            ...t,
            eventId: savedEvent.id,
            availableQuota: t.totalQuota,
          }),
        );
        savedEvent.tiers = await manager.save(tierEntities);
      } else {
        savedEvent.tiers = [];
      }

      return savedEvent;
    });
  }

  async updateEvent(id: string, data: UpdateEventData): Promise<Event> {
    await this.eventRepo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new EntityNotFoundException('Event', id);
    }
    return updated;
  }

  async cancelEvent(id: string): Promise<Event> {
    return this.dataSource.transaction(async (manager) => {
      await manager.update(Event, id, { status: EventStatus.CANCELLED });
      await manager.update(
        Ticket,
        { eventId: id, status: TicketStatus.ISSUED },
        { status: TicketStatus.VOID },
      );

      const updated = await manager.findOne(Event, {
        where: { id },
        relations: { organizer: true, tiers: true },
      });
      if (!updated) {
        throw new EntityNotFoundException('Event', id);
      }
      return updated;
    });
  }

  async createTier(data: CreateTicketTierData): Promise<TicketTier> {
    const tier = this.tierRepo.create({
      ...data,
      availableQuota: data.totalQuota,
    });
    try {
      return await this.tierRepo.save(tier);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new DuplicateTierNameException(data.name);
      }
      throw error;
    }
  }

  async findTierById(tierId: string): Promise<TicketTier | null> {
    return this.tierRepo.findOne({
      where: { id: tierId },
      relations: { event: true },
    });
  }

  // TODO: improve, jangan memakai pattern load-modify-save
  async updateTier(
    tierId: string,
    data: UpdateTicketTierData,
  ): Promise<TicketTier> {
    const tier = await this.findTierById(tierId);
    if (!tier) {
      throw new EntityNotFoundException('Tier tiket', tierId);
    }

    if (data.totalQuota !== undefined) {
      const soldCount = tier.totalQuota - tier.availableQuota;
      if (data.totalQuota < soldCount) {
        throw new InvalidTierQuotaException(data.totalQuota, soldCount);
      }
      tier.availableQuota = data.totalQuota - soldCount;
      tier.totalQuota = data.totalQuota;
    }

    if (data.name !== undefined) tier.name = data.name;
    if (data.price !== undefined) tier.price = data.price;
    if (data.maxPerUser !== undefined) tier.maxPerUser = data.maxPerUser;
    if (data.salesStart !== undefined)
      tier.salesStart = new Date(data.salesStart);
    if (data.salesEnd !== undefined) tier.salesEnd = new Date(data.salesEnd);

    try {
      return await this.tierRepo.save(tier);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new DuplicateTierNameException(data.name ?? tier.name);
      }
      throw error;
    }
  }

  async getEventReports(eventId: string): Promise<EventReport> {
    const event = await this.findById(eventId);
    if (!event) {
      throw new EntityNotFoundException('Event', eventId);
    }

    const tiers = event.tiers || [];

    // TODO: evalute apakah kita bisa pake aggregasi dan perhitungan langsung di DB daripada mapping dan reduce di app
    const rawStats = await this.ticketRepo
      .createQueryBuilder('ticket')
      .innerJoin('ticket.order', 'order')
      .select('ticket.ticketTierId', 'tierId')
      .addSelect('COUNT(ticket.id)', 'soldCount')
      .addSelect('COALESCE(SUM(ticket.pricePaid), 0)', 'revenue')
      .where('ticket.eventId = :eventId', { eventId })
      .andWhere('order.status = :status', { status: OrderStatus.PAID })
      .groupBy('ticket.ticketTierId')
      .getRawMany();

    const statsMap = new Map<string, { soldCount: number; revenue: number }>();
    for (const row of rawStats) {
      statsMap.set(row.tierId, {
        soldCount: parseInt(row.soldCount, 10) || 0,
        revenue: parseFloat(row.revenue) || 0,
      });
    }

    const tierBreakdown = tiers.map((tier) => {
      const stat = statsMap.get(tier.id) ?? { soldCount: 0, revenue: 0 };
      return {
        tierId: tier.id,
        tierName: tier.name,
        price: Number(tier.price),
        totalQuota: tier.totalQuota,
        availableQuota: tier.availableQuota,
        soldCount: stat.soldCount,
        revenue: stat.revenue,
      };
    });

    const totalQuota = tierBreakdown.reduce((acc, t) => acc + t.totalQuota, 0);
    const availableQuota = tierBreakdown.reduce(
      (acc, t) => acc + t.availableQuota,
      0,
    );
    const soldTickets = tierBreakdown.reduce((acc, t) => acc + t.soldCount, 0);
    const totalRevenue = tierBreakdown.reduce((acc, t) => acc + t.revenue, 0);

    return {
      eventId: event.id,
      eventTitle: event.title,
      totalQuota,
      availableQuota,
      soldTickets,
      totalRevenue,
      tierBreakdown,
    };
  }

  async getEventAttendees(
    eventId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Ticket>> {
    const qb = this.ticketRepo
      .createQueryBuilder('ticket')
      .innerJoinAndSelect('ticket.tier', 'tier')
      .innerJoinAndSelect('ticket.order', 'order')
      .innerJoinAndSelect('order.customer', 'customer')
      .where('ticket.eventId = :eventId', { eventId });

    if (pagination.search) {
      qb.andWhere(
        '(ticket.attendeeName ILIKE :search OR ticket.ticketCode ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${pagination.search}%` },
      );
    }

    qb.orderBy('ticket.issuedAt', 'DESC')
      .skip(pagination.skip)
      .take(pagination.take);

    const [items, totalItems] = await qb.getManyAndCount();

    return createPaginatedResult(
      items,
      totalItems,
      pagination.page,
      pagination.limit,
    );
  }

  // FIXME: sepertinya ini akan bermasalah ada duplicated request
  async admitAttendee(eventId: string, ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId, eventId },
      relations: { tier: true, event: true },
    });

    if (!ticket) {
      throw new EntityNotFoundException(
        'Tiket tidak ditemukan pada event ini.',
      );
    }

    if (ticket.status === TicketStatus.ATTENDED) {
      throw new TicketAlreadyUsedException(ticket.admittedAt);
    }

    if (ticket.status === TicketStatus.VOID) {
      throw new TicketVoidException('Tiket ini sudah tidak berlaku (VOID).');
    }

    ticket.status = TicketStatus.ATTENDED;
    ticket.admittedAt = new Date();
    return this.ticketRepo.save(ticket);
  }
}
