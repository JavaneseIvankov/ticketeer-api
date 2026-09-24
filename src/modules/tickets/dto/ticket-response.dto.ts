import { TicketStatus } from '../../../common/enums/index.js';
import { Ticket } from '../entities/ticket.entity.js';

export class TicketResponseDto {
  id: string;
  orderId: string;
  ticketTierId: string;
  eventId: string;
  ticketCode: string;
  attendeeName: string;
  pricePaid: number;
  status: TicketStatus;
  issuedAt: Date;
  admittedAt: Date | null;

  static fromEntity(ticket: Ticket): TicketResponseDto {
    const dto = new TicketResponseDto();
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
    return dto;
  }
}
