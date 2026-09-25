import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception.js';

export class EntityNotFoundException extends DomainException {
  constructor(entityNameOrDetail: string, identifier?: string | number) {
    let message: string;
    if (identifier !== undefined) {
      message = `${entityNameOrDetail} dengan ID ${identifier} tidak ditemukan.`;
    } else {
      message = `${entityNameOrDetail} tidak ditemukan.`;
    }
    super('RESOURCE_NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}

export class ForbiddenResourceException extends DomainException {
  constructor(detail = 'Anda tidak memiliki hak akses untuk resource ini.') {
    super('FORBIDDEN_RESOURCE_ACCESS', detail, HttpStatus.FORBIDDEN);
  }
}

export class DuplicateResourceException extends DomainException {
  constructor(detail = 'Data dengan nilai unik tersebut sudah ada.') {
    super('DUPLICATE_RESOURCE', detail, HttpStatus.CONFLICT);
  }
}