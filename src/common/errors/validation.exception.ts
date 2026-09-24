import { BadRequestException, HttpStatus } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export interface FieldError {
  field: string;
  message: string;
}

export function formatValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldError[] {
  return errors.flatMap((err) => {
    const field = parentPath ? `${parentPath}.${err.property}` : err.property;
    const current = Object.values(err.constraints || {}).map((message) => ({
      field,
      message,
    }));
    const children = err.children?.length
      ? formatValidationErrors(err.children, field)
      : [];
    return [...current, ...children];
  });
}

export class ValidationException extends BadRequestException {
  public readonly fieldErrors: FieldError[];

  constructor(validationErrors: ValidationError[]) {
    const fieldErrors = formatValidationErrors(validationErrors);
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'VALIDATION_ERROR',
      message: 'Validasi input gagal.',
      errors: fieldErrors,
    });
    this.fieldErrors = fieldErrors;
  }
}
