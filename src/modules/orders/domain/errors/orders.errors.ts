import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../../common/errors/domain.exception.js';

export class QuotaExceededException extends DomainException {
  constructor(
    detail = 'Tiket habis atau kuota tidak mencukupi untuk jumlah yang diminta.',
  ) {
    super('TIER_QUOTA_EXCEEDED', detail, HttpStatus.CONFLICT);
  }
}

export class SalesWindowClosedException extends DomainException {
  constructor(
    detail = 'Penjualan tiket untuk tier ini belum dibuka atau sudah ditutup.',
  ) {
    super('SALES_WINDOW_CLOSED', detail, HttpStatus.BAD_REQUEST);
  }
}

export class MaxPerUserExceededException extends DomainException {
  constructor(detailOrMax: number | string) {
    const detail =
      typeof detailOrMax === 'number'
        ? `Jumlah tiket melebihi batas pembelian maksimum per pengguna (${detailOrMax}).`
        : detailOrMax;
    super('MAX_PER_USER_EXCEEDED', detail, HttpStatus.BAD_REQUEST);
  }
}
