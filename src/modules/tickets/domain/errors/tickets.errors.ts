import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../../common/errors/domain.exception.js';

export class TicketAlreadyUsedException extends DomainException {
  constructor(usedAt?: Date | string | null) {
    const detail = usedAt
      ? `Tiket ini sudah pernah digunakan untuk check-in pada ${new Date(usedAt).toISOString()}.`
      : 'Tiket ini sudah pernah digunakan untuk check-in.';
    super('TICKET_ALREADY_USED', detail, HttpStatus.BAD_REQUEST);
  }
}

export class TicketVoidException extends DomainException {
  constructor(detail = 'Tiket ini sudah tidak berlaku (VOID).') {
    super('TICKET_VOID', detail, HttpStatus.BAD_REQUEST);
  }
}
