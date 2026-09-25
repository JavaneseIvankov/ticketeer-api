import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../errors/domain.exception.js';
import {
  FieldError,
  ValidationException,
} from '../errors/validation.exception.js';
import { ApiErrorResponseDto } from '../dto/api-response.dto.js';

export interface ErrorDetails {
  statusCode: number;
  code: string;
  message: string;
  errors?: FieldError[];
}

const DEFAULT_MESSAGE =
  'Terjadi kesalahan internal pada server, silahkan coba lagi nanti.';

@Catch()
export class AppHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const details = this.getErrorDetails(exception);

    if (details.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const err =
        exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(
        `[${request.method}] ${request.url} - ${err.message}`,
        err.stack,
      );
    } else if (details.statusCode >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(
        `[${request.method}] ${request.url} [${details.statusCode}] ${details.message}`,
      );
    }

    const payload: ApiErrorResponseDto = {
      statusCode: details.statusCode,
      code: details.code,
      message: details.message,
      timestamp: new Date().toISOString(),
      path: request?.url ?? '',
      ...(details.errors?.length ? { errors: details.errors } : {}),
    };

    response.status(details.statusCode).json(payload);
  }

  private getErrorDetails(exception: unknown): ErrorDetails {
    if (exception instanceof ValidationException) {
      return {
        statusCode: exception.getStatus(),
        code: 'VALIDATION_ERROR',
        message: 'Validasi input gagal.',
        errors: exception.fieldErrors,
      };
    }

    if (exception instanceof DomainException) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.detail,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      return {
        statusCode: status,
        code: HttpStatus[status] ?? 'HTTP_EXCEPTION',
        message: this.extractHttpMesage(exception),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: DEFAULT_MESSAGE,
    };
  }

  private extractHttpMesage(exception: HttpException): string {
    const res = exception.getResponse();
    const status = exception.getStatus();
    if (typeof res === 'string') {
      return res;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return DEFAULT_MESSAGE;
    }

    if (typeof res === 'object' && res !== null && 'message' in res) {
      const { message } = res as { message?: unknown };
      if (Array.isArray(message)) return message.join(', ');
      if (typeof message === 'string') return message;
    }

    return exception.message;
  }
}
