import { FieldError } from '../errors/validation.exception.js';
import { PaginationMeta } from '../interfaces/paginated-result.interface.js';

export interface DataResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export class PaginationMetaDto implements PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ini untuk validation error
export class ApiFieldErrorDto {
  field: string;
  message: string;
}

export type ApiFieldError = ApiFieldErrorDto;

export interface ApiErrorResponseDto {
  statusCode: number;
  code: string;
  message: string;
  errors?: FieldError[];
  timestamp: string;
  path: string;
}
