export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function createPaginatedResult<T>(
  data: T[],
  totalItems: number,
  page: number = 1,
  limit: number = 10,
): PaginatedResult<T> {
  const safePage = Math.max(1, page ?? 1);
  const safeLimit = Math.max(1, limit ?? 10);
  const totalPages = Math.ceil(totalItems / safeLimit);

  return {
    data,
    meta: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}
