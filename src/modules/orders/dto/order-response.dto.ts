import { OrderStatus } from '../../../common/enums/index.js';
import { Order } from '../entities/order.entity.js';
import { TicketResponseDto } from '../../tickets/dto/ticket-response.dto.js';

export class OrderResponseDto {
  id: string;
  orderNumber: string;
  customerId: string;
  ticketTierId: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  expiresAt: Date;
  createdAt: Date;
  tickets?: TicketResponseDto[];

  static fromEntity(order: Order): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.orderNumber = order.orderNumber;
    dto.customerId = order.customerId;
    dto.ticketTierId = order.ticketTierId;
    dto.quantity = order.quantity;
    dto.totalAmount = Number(order.totalAmount);
    dto.status = order.status;
    dto.expiresAt = order.expiresAt;
    dto.createdAt = order.createdAt;
    if (order.tickets && order.tickets.length > 0) {
      dto.tickets = order.tickets.map((t) => TicketResponseDto.fromEntity(t));
    }
    return dto;
  }
}
