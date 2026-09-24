import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../../common/errors/domain.exception.js';

export class InvalidDateRangeException extends DomainException {
  constructor(detail = 'Rentang waktu tidak valid.') {
    super('INVALID_DATE_RANGE', detail, HttpStatus.BAD_REQUEST);
  }
}
