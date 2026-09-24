import { PaginationQueryDto } from '../../common/dto/pagination-query-dto.js';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface.js';
import { Order, User } from '../../database/entities.js';
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
