import { type ApiError, parseApiError } from './schemas/api-error.schema';
import type { HttpSuccessStatus } from './types/http';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export function toApiResult<T extends { status: number; body: unknown }>(
  result: T,
): ApiResult<Extract<T, { status: HttpSuccessStatus }>['body']> {
  if (result.status < 200 || result.status >= 300) {
    return {
      ok: false,
      error: parseApiError(result.status, result.body) satisfies ApiError,
    };
  }
  return {
    ok: true,
    data: result.body as Extract<T, { status: HttpSuccessStatus }>['body'],
  };
}

export function throwOnError<T extends { status: number; body: unknown }>(
  result: T,
): asserts result is Extract<T, { status: HttpSuccessStatus }> {
  if (result.status < 200 || result.status >= 300) {
    throw parseApiError(result.status, result.body);
  }
}
