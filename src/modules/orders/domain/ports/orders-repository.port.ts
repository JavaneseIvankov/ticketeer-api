import { Order } from '../../entities/order.entity.js';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query-dto.js';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface.js';

export interface ReserveParams {
  customerId: string;
  eventId: string;
  ticketTierId: string;
  quantity: number;
  totalAmount: number;
  orderNumber: string;
  expiresAt: Date;
  idempotencyKey?: string | null;
}

export abstract class OrdersRepository {
  abstract reserve(params: ReserveParams): Promise<Order>;
  abstract findById(id: string): Promise<Order | null>;
  abstract findByIdempotencyKey(key: string): Promise<Order | null>;
  abstract findByCustomerId(
    customerId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Order>>;
  abstract countUserReservedQuantityForTier(
    customerId: string,
    ticketTierId: string,
  ): Promise<number>;
}
