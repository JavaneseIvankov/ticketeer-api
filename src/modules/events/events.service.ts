import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query-dto.js';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface.js';
import { Event, Ticket, TicketTier, User } from '../../database/entities.js';
import { EventStatus } from '../../common/enums/index.js';
import {
  EntityNotFoundException,
  ForbiddenResourceException,
} from '../../common/errors/generic-domain.exception.js';
import { InvalidDateRangeException } from './domain/errors/events.errors.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { CreateTicketTierDto } from './dto/create-tier.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { UpdateTicketTierDto } from './dto/update-tier.dto.js';
import { EventsRepository } from './domain/ports/events-repository.port.js';

// TODO: move to repository contract/port
export interface EventReport {
  eventId: string;
  eventTitle: string;
  totalQuota: number;
  availableQuota: number;
  soldTickets: number;
  totalRevenue: number;
  tierBreakdown: {
    tierId: string;
    tierName: string;
    price: number;
    totalQuota: number;
    availableQuota: number;
    soldCount: number;
    revenue: number;
  }[];
}

export interface IEventsService {
  findPublishedEvents(
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Event>>;
  findOrganizerEvents(
    user: User,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Event>>;
  getEventById(id: string): Promise<Event>;
  createEvent(user: User, dto: CreateEventDto): Promise<Event>;
  updateEvent(eventId: string, user: User, dto: UpdateEventDto): Promise<Event>;
  cancelEvent(eventId: string, user: User): Promise<Event>;
  addTicketTier(
    eventId: string,
    user: User,
    dto: CreateTicketTierDto,
  ): Promise<TicketTier>;
  updateTicketTier(
    eventId: string,
    tierId: string,
    user: User,
    dto: UpdateTicketTierDto,
  ): Promise<TicketTier>;
  getEventReports(eventId: string, user: User): Promise<EventReport>;
  getEventAttendees(
    eventId: string,
    user: User,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Ticket>>;
  admitAttendee(eventId: string, ticketId: string, user: User): Promise<Ticket>;
}

@Injectable()
export class EventsService implements IEventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async findPublishedEvents(
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Event>> {
    return this.eventsRepository.findEvents(pagination, {
      status: EventStatus.PUBLISHED,
    });
  }

  async findOrganizerEvents(
    user: User,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Event>> {
    return this.eventsRepository.findEvents(pagination, {
      organizerId: user.id,
    });
  }

  async getEventById(id: string): Promise<Event> {
    const event = await this.eventsRepository.findById(id);
    if (!event) {
      throw new EntityNotFoundException('Event', id);
    }
    return event;
  }

  async createEvent(user: User, dto: CreateEventDto): Promise<Event> {
    if (new Date(dto.eventDate) <= new Date()) {
      throw new InvalidDateRangeException(
        'Tanggal acara harus berada di masa mendatang.',
      );
    }

    if (dto.tiers && dto.tiers.length > 0) {
      for (const tier of dto.tiers) {
        if (new Date(tier.salesStart) >= new Date(tier.salesEnd)) {
          throw new InvalidDateRangeException(
            `Tier '${tier.name}': Waktu mulai penjualan harus sebelum waktu berakhir penjualan.`,
          );
        }
      }
    }

    return this.eventsRepository.createEvent(
      {
        title: dto.title,
        description: dto.description,
        venue: dto.venue,
        eventDate: new Date(dto.eventDate),
        organizerId: user.id,
        status: dto.status ?? EventStatus.PUBLISHED,
      },
      dto.tiers?.map((t) => ({
        name: t.name,
        price: t.price,
        totalQuota: t.totalQuota,
        maxPerUser: t.maxPerUser,
        salesStart: new Date(t.salesStart),
        salesEnd: new Date(t.salesEnd),
      })),
    );
  }

  async updateEvent(
    eventId: string,
    user: User,
    dto: UpdateEventDto,
  ): Promise<Event> {
    const event = await this.getEventById(eventId);
    this.assertOwnership(event, user);

    if (dto.eventDate && new Date(dto.eventDate) <= new Date()) {
      throw new InvalidDateRangeException(
        'Tanggal acara harus berada di masa mendatang.',
      );
    }

    return this.eventsRepository.updateEvent(eventId, {
      title: dto.title,
      description: dto.description,
      venue: dto.venue,
      status: dto.status,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
    });
  }

  async cancelEvent(_eventId: string, _user: User): Promise<Event> {
    throw new Error('Method not implemented yet.');
  }

  async addTicketTier(
    eventId: string,
    user: User,
    dto: CreateTicketTierDto,
  ): Promise<TicketTier> {
    throw new Error('Method not implemented yet.');
  }

  async updateTicketTier(
    eventId: string,
    tierId: string,
    user: User,
    dto: UpdateTicketTierDto,
  ): Promise<TicketTier> {
    throw new Error('Method not implemented yet.');
  }

  async getEventReports(_eventId: string, _user: User): Promise<EventReport> {
    throw new Error('Method not implemented yet.');
  }

  async getEventAttendees(
    eventId: string,
    user: User,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Ticket>> {
    throw new Error('Method not implemented yet.');
  }

  async admitAttendee(
    eventId: string,
    ticketId: string,
    user: User,
  ): Promise<Ticket> {
    throw new Error('Method not implemented yet.');
  }

  private assertOwnership(event: Event, user: User): void {
    if (event.organizerId !== user.id) {
      throw new ForbiddenResourceException(
        'Anda tidak memiliki otoritas atas event yang dikelola organizer lain.',
      );
    }
  }
}
