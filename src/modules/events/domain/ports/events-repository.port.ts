import { Event } from '../../entities/event.entity.js';
import { TicketTier } from '../../entities/ticket-tier.entity.js';
import { Ticket } from '../../../tickets/entities/ticket.entity.js';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query-dto.js';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface.js';
import { EventStatus } from '../../../../common/enums/index.js';

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

export interface FindEventsFilter {
  organizerId?: string;
  status?: EventStatus;
}

export interface CreateTicketTierData {
  name: string;
  price: number;
  totalQuota: number;
  maxPerUser?: number;
  salesStart: Date;
  salesEnd: Date;
  eventId?: string;
}

export interface UpdateTicketTierData {
  name?: string;
  price?: number;
  totalQuota?: number;
  maxPerUser?: number;
  salesStart?: Date;
  salesEnd?: Date;
}

export interface CreateEventData {
  organizerId: string;
  title: string;
  description: string;
  venue: string;
  eventDate: Date;
  status?: EventStatus;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  venue?: string;
  eventDate?: Date;
  status?: EventStatus;
}

export abstract class EventsRepository {
  abstract findEvents(
    pagination: PaginationQueryDto,
    filter?: FindEventsFilter,
  ): Promise<PaginatedResult<Event>>;
  abstract findById(id: string): Promise<Event | null>;
  abstract createEvent(
    data: CreateEventData,
    tiers?: CreateTicketTierData[],
  ): Promise<Event>;
  abstract updateEvent(id: string, data: UpdateEventData): Promise<Event>;
  abstract cancelEvent(id: string): Promise<Event>;
  abstract createTier(data: CreateTicketTierData): Promise<TicketTier>;
  abstract findTierById(tierId: string): Promise<TicketTier | null>;
  abstract updateTier(
    tierId: string,
    data: UpdateTicketTierData,
  ): Promise<TicketTier>;
  abstract getEventReports(eventId: string): Promise<EventReport>;
  abstract getEventAttendees(
    eventId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Ticket>>;
  abstract admitAttendee(eventId: string, ticketId: string): Promise<Ticket>;
}
