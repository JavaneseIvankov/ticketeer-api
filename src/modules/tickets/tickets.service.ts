import { PaginationQueryDto } from '../../common/dto/pagination-query-dto.js';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface.js';
import { Ticket, User } from '../../database/entities.js';

export interface ITicketsService {
  getMyTickets(
    user: User,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Ticket>>;
  getTicketById(ticketId: string, user: User): Promise<Ticket>;
  getTicketByCode(ticketCode: string, user: User): Promise<Ticket>;
}
