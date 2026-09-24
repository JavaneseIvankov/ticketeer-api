import { TicketTier } from '../entities/ticket-tier.entity.js';

export class TicketTierResponseDto {
  id: string;
  eventId: string;
  name: string;
  price: number;
  totalQuota: number;
  availableQuota: number;
  maxPerUser: number;
  salesStart: Date;
  salesEnd: Date;

  static fromEntity(tier: TicketTier): TicketTierResponseDto {
    const dto = new TicketTierResponseDto();
    dto.id = tier.id;
    dto.eventId = tier.eventId;
    dto.name = tier.name;
    dto.price = Number(tier.price);
    dto.totalQuota = tier.totalQuota;
    dto.availableQuota = tier.availableQuota;
    dto.maxPerUser = tier.maxPerUser;
    dto.salesStart = tier.salesStart;
    dto.salesEnd = tier.salesEnd;
    return dto;
  }
}
