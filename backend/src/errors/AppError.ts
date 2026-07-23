export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
  details?: ErrorDetail[];
}

/**
 * Builds a consistent JSON error response body for API clients.
 *
 * @param message Human-readable error summary.
 * @param details Optional field-level validation errors.
 * @returns Structured error response matching the API contract.
 */
export function toErrorResponse(
  message: string,
  details?: ErrorDetail[]
): ErrorResponse {
  const body: ErrorResponse = { error: message };

  if (details && details.length > 0) {
    body.details = details;
  }

  return body;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: ErrorDetail[];

  constructor(
    statusCode: number,
    message: string,
    details?: ErrorDetail[]
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super(400, message, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}
