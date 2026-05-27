import { type ApiError, ApiErrorSchema, ErrorCode } from '@cityborn/api';

type HttpSuccessStatus = 200 | 201 | 202 | 203 | 204 | 205 | 206;

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

export function throwOnError<T extends { status: number; body: unknown }>(
  result: T,
): asserts result is Extract<T, { status: HttpSuccessStatus }> {
  if (result.status < 200 || result.status >= 300) {
    const parsed = ApiErrorSchema.safeParse(result.body);

    if (parsed.success) {
      throw parsed.data;
    }

    throw {
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Unexpected error',
      statusCode: result.status,
    } satisfies ApiError;
  }
}
