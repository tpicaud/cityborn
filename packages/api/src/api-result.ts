import { ErrorCode } from './errors/error-codes.js';
import { type ApiError, ApiErrorSchema } from './schemas/api-error.schema.js';
import type { HttpSuccessStatus } from './types/http.js';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export function toApiResult<T extends { status: number; body: unknown }>(
  result: T,
): ApiResult<Extract<T, { status: HttpSuccessStatus }>['body']> {
  if (result.status < 200 || result.status >= 300) {
    const parsed = ApiErrorSchema.safeParse(result.body);
    return {
      ok: false,
      error: parsed.success
        ? parsed.data
        : {
            code: ErrorCode.UNKNOWN_ERROR,
            message: 'Unexpected error',
            statusCode: result.status,
          },
    };
  }
  return {
    ok: true,
    data: result.body as Extract<T, { status: HttpSuccessStatus }>['body'],
  };
}
