import { Ticket } from '../entities/ticket.entity.js';
import { TicketResponseDto } from './ticket-response.dto.js';
import { EventResponseDto } from '../../events/dto/event-response.dto.js';
import { TicketTierResponseDto } from '../../events/dto/ticket-tier-response.dto.js';

export class TicketDetailResponseDto extends TicketResponseDto {
  event?: EventResponseDto | null;
  tier?: TicketTierResponseDto | null;

  static override fromEntity(ticket: Ticket): TicketDetailResponseDto {
    const dto = new TicketDetailResponseDto();
    dto.id = ticket.id;
    dto.orderId = ticket.orderId;
    dto.ticketTierId = ticket.ticketTierId;
    dto.eventId = ticket.eventId;
    dto.ticketCode = ticket.ticketCode;
    dto.attendeeName = ticket.attendeeName;
    dto.pricePaid = Number(ticket.pricePaid);
    dto.status = ticket.status;
    dto.issuedAt = ticket.issuedAt;
    dto.admittedAt = ticket.admittedAt;
    dto.event = ticket.event ? EventResponseDto.fromEntity(ticket.event) : null;
    dto.tier = ticket.tier
      ? TicketTierResponseDto.fromEntity(ticket.tier)
      : null;
    return dto;
  }
}
