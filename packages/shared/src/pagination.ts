export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: PaginationMetadata;
}

export const PAGINATION_DEFAULT = {
  PAGE: 1,
  LIMIT: 10,
};

/**
 * Extract pagination parameters from a Request object.
 */
export function getPaginationParams(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = Math.max(1, Number.isNaN(rawPage) ? PAGINATION_DEFAULT.PAGE : rawPage);
  const rawLimit = parseInt(searchParams.get("limit") || PAGINATION_DEFAULT.LIMIT.toString(), 10);
  const limit = Math.min(
    100,
    Math.max(1, Number.isNaN(rawLimit) ? PAGINATION_DEFAULT.LIMIT : rawLimit),
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Calculate pagination metadata.
 */
export function calculateMetadata(total: number, page: number, limit: number): PaginationMetadata {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
