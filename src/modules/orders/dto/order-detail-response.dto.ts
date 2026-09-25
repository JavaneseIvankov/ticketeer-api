import { Order } from '../entities/order.entity.js';
import { OrderResponseDto } from './order-response.dto.js';
import { TicketTierResponseDto } from '../../events/dto/ticket-tier-response.dto.js';

export class OrderDetailResponseDto extends OrderResponseDto {
  tier?: TicketTierResponseDto | null;

  static override fromEntity(order: Order): OrderDetailResponseDto {
    const dto = super.fromEntity(order) as OrderDetailResponseDto;
    dto.tier = order.tier ? TicketTierResponseDto.fromEntity(order.tier) : null;
    return dto;
  }
}
