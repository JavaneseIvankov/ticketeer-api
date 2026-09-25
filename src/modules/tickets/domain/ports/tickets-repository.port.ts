import { Ticket } from '../../entities/ticket.entity.js';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query-dto.js';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface.js';

export abstract class TicketsRepository {
  abstract findByCustomerId(
    customerId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Ticket>>;
  abstract findById(id: string): Promise<Ticket | null>;
  abstract findByTicketCode(ticketCode: string): Promise<Ticket | null>;
}
