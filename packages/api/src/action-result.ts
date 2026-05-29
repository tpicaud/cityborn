import { ApiErrorSchema, type ApiError } from './schemas/api-error.schema.js';
import { ErrorCode } from './errors/error-codes.js';
import { type HttpSuccessStatus } from './types/http.js';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export function toActionResult<T extends { status: number; body: unknown }>(
  result: T,
): ActionResult<Extract<T, { status: HttpSuccessStatus }>['body']> {
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
