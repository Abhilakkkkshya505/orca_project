/**
 * Standard API error model for ORCA.
 * Matches backend uniform error shape:
 * { "error": { "code": string, "message": string, "details": object, "request_id": string } }
 */

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  request_id?: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export class ApiError extends Error {
  readonly code: string;
  readonly details: Record<string, string[]>;
  readonly requestId?: string;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(
    code: string,
    message: string,
    status: number,
    details: Record<string, string[]> = {},
    requestId?: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
