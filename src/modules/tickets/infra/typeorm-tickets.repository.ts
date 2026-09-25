import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity.js';
import { TicketsRepository } from '../domain/ports/tickets-repository.port.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query-dto.js';
import {
  PaginatedResult,
  createPaginatedResult,
} from '../../../common/interfaces/paginated-result.interface.js';

@Injectable()
export class TypeOrmTicketsRepository extends TicketsRepository {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {
    super();
  }

  async findByCustomerId(
    customerId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Ticket>> {
    const qb = this.ticketRepo
      .createQueryBuilder('ticket')
      .innerJoinAndSelect('ticket.order', 'order')
      .innerJoinAndSelect('ticket.tier', 'tier')
      .innerJoinAndSelect('ticket.event', 'event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('order.customerId = :customerId', { customerId });

    if (pagination.search) {
      qb.andWhere(
        '(ticket.attendeeName ILIKE :search OR ticket.ticketCode ILIKE :search OR event.title ILIKE :search)',
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

  async findById(id: string): Promise<Ticket | null> {
    return this.ticketRepo.findOne({
      where: { id },
      relations: {
        order: { customer: true },
        tier: true,
        event: { organizer: true },
      },
    });
  }

  async findByTicketCode(ticketCode: string): Promise<Ticket | null> {
    return this.ticketRepo.findOne({
      where: { ticketCode },
      relations: {
        order: { customer: true },
        tier: true,
        event: { organizer: true },
      },
    });
  }
}
