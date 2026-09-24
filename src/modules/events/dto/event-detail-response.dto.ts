import { Event } from '../entities/event.entity.js';
import { EventResponseDto } from './event-response.dto.js';
import { TicketTierResponseDto } from './ticket-tier-response.dto.js';

export class EventDetailResponseDto extends EventResponseDto {
  tiers: TicketTierResponseDto[];

  static override fromEntity(event: Event): EventDetailResponseDto {
    const base = EventResponseDto.fromEntity(event);
    const dto = new EventDetailResponseDto();
    Object.assign(dto, base);
    dto.tiers = (event.tiers || []).map((t) =>
      TicketTierResponseDto.fromEntity(t),
    );
    return dto;
  }
}
