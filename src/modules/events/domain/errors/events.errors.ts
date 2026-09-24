import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../../common/errors/domain.exception.js';

export class InvalidDateRangeException extends DomainException {
  constructor(detail = 'Rentang waktu tidak valid.') {
    super('INVALID_DATE_RANGE', detail, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidEventStateException extends DomainException {
  constructor(detail = 'Status event tidak valid untuk operasi ini.') {
    super('INVALID_EVENT_STATE', detail, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidTierQuotaException extends DomainException {
  constructor(requestedQuota: number, bookedTickets: number) {
    super(
      'INVALID_TIER_QUOTA',
      `Total kuota (${requestedQuota}) tidak boleh kurang dari tiket yang sudah terbit (${bookedTickets}).`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class DuplicateTierNameException extends DomainException {
  constructor(tierName: string) {
    super(
      'DUPLICATE_TIER_NAME',
      `Tier dengan nama "${tierName}" sudah ada pada event ini.`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

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

