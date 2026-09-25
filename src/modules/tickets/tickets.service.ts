import { Injectable, Logger } from '@nestjs/common';
import {
  EntityNotFoundException,
  ForbiddenResourceException,
} from '../../common/errors/generic-domain.exception.js';
import { TicketsRepository } from './domain/ports/tickets-repository.port.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query-dto.js';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface.js';
import { Ticket } from './entities/ticket.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UserRole } from '../../common/enums/index.js';

@Injectable()
export class TicketsService implements ITicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly ticketsRepository: TicketsRepository) {}

  async getMyTickets(
    user: User,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Ticket>> {
    this.logger.log(`Fetching tickets for customer ${user.id}`);
    return this.ticketsRepository.findByCustomerId(user.id, pagination);
  }

  async getTicketById(ticketId: string, user: User): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findById(ticketId);
    if (!ticket) {
      throw new EntityNotFoundException('Tiket', ticketId);
    }

    if (
      user.role === UserRole.CUSTOMER &&
      ticket.order?.customerId !== user.id
    ) {
      throw new ForbiddenResourceException(
        'Anda tidak memiliki otoritas untuk mengakses tiket ini.',
      );
    }

    if (
      user.role === UserRole.ORGANIZER &&
      ticket.event?.organizerId !== user.id
    ) {
      throw new ForbiddenResourceException(
        'Tiket ini tidak terkait dengan acara yang Anda kelola.',
      );
    }

    this.logger.log(`Ticket retrieved: ${ticket.ticketCode} by user ${user.id}`);
    return ticket;
  }

  async getTicketByCode(ticketCode: string, user: User): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findByTicketCode(ticketCode);
    if (!ticket) {
      throw new EntityNotFoundException(
        `Tiket dengan kode ${ticketCode} tidak ditemukan.`,
      );
    }

    if (
      user.role === UserRole.CUSTOMER &&
      ticket.order?.customerId !== user.id
    ) {
      throw new ForbiddenResourceException(
        'Anda tidak memiliki otoritas untuk mengakses tiket ini.',
      );
    }

    if (
      user.role === UserRole.ORGANIZER &&
      ticket.event?.organizerId !== user.id
    ) {
      throw new ForbiddenResourceException(
        'Tiket ini tidak terkait dengan acara yang Anda kelola.',
      );
    }

    this.logger.log(`Ticket retrieved by code: ${ticketCode}`);
    return ticket;
  }
}

export interface ITicketsService {
  getMyTickets(
    user: User,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Ticket>>;
  getTicketById(ticketId: string, user: User): Promise<Ticket>;
  getTicketByCode(ticketCode: string, user: User): Promise<Ticket>;
}
