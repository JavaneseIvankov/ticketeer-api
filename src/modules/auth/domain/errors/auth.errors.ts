import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../../common/errors/domain.exception.js';

export class InvalidCredentialsException extends DomainException {
  constructor(detail = 'Kombinasi email atau password salah.') {
    super('INVALID_CREDENTIALS', detail, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidRefreshTokenException extends DomainException {
  constructor(detail = 'Refresh token tidak valid atau telah kedaluwarsa.') {
    super('INVALID_REFRESH_TOKEN', detail, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenReuseDetectedException extends DomainException {
  constructor(
    detail = 'Token reuse detected. Sesi keamanan Anda telah dihentikan, silakan login kembali.',
  ) {
    super('TOKEN_REUSE_DETECTED', detail, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenRevokedException extends DomainException {
  constructor(
    detail = 'Refresh token telah dicabut (revoked) atau sesi telah berakhir.',
  ) {
    super('TOKEN_REVOKED', detail, HttpStatus.UNAUTHORIZED);
  }
}

export class EmailAlreadyRegisteredException extends DomainException {
  constructor(detail = 'Email ini sudah terdaftar dalam sistem.') {
    super('EMAIL_ALREADY_REGISTERED', detail, HttpStatus.CONFLICT);
  }
}
