export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Thrown by service functions for expected, user-facing violations (e.g. FK
 * constraints, business rules). API routes catch this to return a 409 with the
 * message rather than a generic 500.
 */
export class BusinessError extends Error {
  readonly statusCode = HTTP_STATUS.CONFLICT;
  constructor(message: string) {
    super(message);
    this.name = "BusinessError";
  }
}
