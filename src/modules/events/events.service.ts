import { PaginationQueryDto } from '../../common/dto/pagination-query-dto.js';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface.js';
import { Ticket, TicketTier, User } from '../../database/entities.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { CreateTicketTierDto } from './dto/create-tier.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { UpdateTicketTierDto } from './dto/update-tier.dto.js';

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

interface IEventsService {
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
