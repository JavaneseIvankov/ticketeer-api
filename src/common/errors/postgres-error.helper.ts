import { QueryFailedError } from 'typeorm';
import type { DatabaseError } from 'pg';

export const PG_ERRORS = {
  NOT_NULL: '23502',
  FOREIGN_KEY: '23503',
  UNIQUE: '23505',
  CHECK: '23514',
} as const;

export type PgErrorCode = (typeof PG_ERRORS)[keyof typeof PG_ERRORS];

export function asPgError(error: unknown): DatabaseError | null {
  if (error instanceof QueryFailedError && error.driverError) {
    return error.driverError as DatabaseError;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return error as DatabaseError;
  }
  return null;
}

export function isPgConstraint(
  error: unknown,
  code: PgErrorCode,
  constraintName?: string,
): boolean {
  const pgErr = asPgError(error);
  if (!pgErr || pgErr.code !== code) return false;

  return constraintName ? pgErr.constraint === constraintName : true;
}

export const isUniqueConstraint = (err: unknown, constraint?: string) =>
  isPgConstraint(err, PG_ERRORS.UNIQUE, constraint);

export const isForeignKeyConstraint = (err: unknown, constraint?: string) =>
  isPgConstraint(err, PG_ERRORS.FOREIGN_KEY, constraint);

export const isCheckConstraint = (err: unknown, constraint?: string) =>
  isPgConstraint(err, PG_ERRORS.CHECK, constraint);

export const isUniqueViolation = isUniqueConstraint;
export const isCheckViolation = isCheckConstraint;
export const getPostgresDriverError = asPgError;
