import { Injectable, Logger } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query-dto.js';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface.js';
import { Event, Ticket, TicketTier, User } from '../../database/entities.js';
import { EventStatus } from '../../common/enums/index.js';
import {
  EntityNotFoundException,
  ForbiddenResourceException,
} from '../../common/errors/generic-domain.exception.js';
import {
  InvalidDateRangeException,
  InvalidEventStateException,
} from './domain/errors/events.errors.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { CreateTicketTierDto } from './dto/create-tier.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { UpdateTicketTierDto } from './dto/update-tier.dto.js';
import {
  EventReport,
  EventsRepository,
} from './domain/ports/events-repository.port.js';

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
  private readonly logger = new Logger(EventsService.name);

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

    const event = await this.eventsRepository.createEvent(
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

    this.logger.log(
      `Event created: "${event.title}" with id ${event.id}, by organizer ${user.id}`,
    );

    return event;
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

  async cancelEvent(eventId: string, user: User): Promise<Event> {
    const event = await this.getEventById(eventId);
    this.assertOwnership(event, user);

    if (event.status === EventStatus.CANCELLED) {
      throw new InvalidEventStateException(
        'Event ini sudah dalam status CANCELLED.',
      );
    }

    const cancelled = await this.eventsRepository.cancelEvent(eventId);
    this.logger.log(`Event ${eventId} cancelled by organizer ${user.id}`);
    return cancelled;
  }

  async addTicketTier(
    eventId: string,
    user: User,
    dto: CreateTicketTierDto,
  ): Promise<TicketTier> {
    const event = await this.getEventById(eventId);
    this.assertOwnership(event, user);

    if (new Date(dto.salesStart) >= new Date(dto.salesEnd)) {
      throw new InvalidDateRangeException(
        'Waktu mulai penjualan harus sebelum waktu akhir penjualan.',
      );
    }

    return this.eventsRepository.createTier({
      name: dto.name,
      price: dto.price,
      totalQuota: dto.totalQuota,
      maxPerUser: dto.maxPerUser,
      eventId,
      salesStart: new Date(dto.salesStart),
      salesEnd: new Date(dto.salesEnd),
    });
  }

  async updateTicketTier(
    eventId: string,
    tierId: string,
    user: User,
    dto: UpdateTicketTierDto,
  ): Promise<TicketTier> {
    const event = await this.getEventById(eventId);
    this.assertOwnership(event, user);

    const tier = await this.eventsRepository.findTierById(tierId);
    if (!tier || tier.eventId !== eventId) {
      throw new EntityNotFoundException(
        `Tier tiket dengan ID ${tierId} tidak ditemukan pada event ini.`,
      );
    }

    if (dto.salesStart && dto.salesEnd) {
      if (new Date(dto.salesStart) >= new Date(dto.salesEnd)) {
        throw new InvalidDateRangeException(
          'Waktu mulai penjualan harus sebelum waktu akhir penjualan.',
        );
      }
    }

    return this.eventsRepository.updateTier(tierId, {
      name: dto.name,
      price: dto.price,
      totalQuota: dto.totalQuota,
      maxPerUser: dto.maxPerUser,
      salesStart: dto.salesStart ? new Date(dto.salesStart) : undefined,
      salesEnd: dto.salesEnd ? new Date(dto.salesEnd) : undefined,
    });
  }

  async getEventReports(eventId: string, user: User): Promise<EventReport> {
    const event = await this.getEventById(eventId);
    this.assertOwnership(event, user);

    return this.eventsRepository.getEventReports(eventId);
  }

  async getEventAttendees(
    eventId: string,
    user: User,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Ticket>> {
    const event = await this.getEventById(eventId);
    this.assertOwnership(event, user);

    return this.eventsRepository.getEventAttendees(eventId, pagination);
  }

  async admitAttendee(
    eventId: string,
    ticketId: string,
    user: User,
  ): Promise<Ticket> {
    const event = await this.getEventById(eventId);
    this.assertOwnership(event, user);

    const ticket = await this.eventsRepository.admitAttendee(eventId, ticketId);
    this.logger.log(
      `Attendee checkin: ticket ${ticket.ticketCode} admited for event ${eventId}`,
    );
    return ticket;
  }

  private assertOwnership(event: Event, user: User): void {
    if (event.organizerId !== user.id) {
      throw new ForbiddenResourceException(
        'Anda tidak memiliki otoritas atas event yang dikelola organizer lain.',
      );
    }
  }
}
