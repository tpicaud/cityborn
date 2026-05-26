import { ApiError, ErrorCode } from '@cityborn/errors';

type HttpSuccessStatus = 200 | 201 | 202 | 203 | 204 | 205 | 206;

export function throwOnError<T extends { status: number; body: unknown }>(
  result: T,
): asserts result is Extract<T, { status: HttpSuccessStatus }> {
  if (result.status < 200 || result.status >= 300) {
    const body = result.body as {
      code?: string;
      message?: string;
      statusCode?: number;
    };
    throw new ApiError(
      (body?.code ?? ErrorCode.UNKNOWN_ERROR) as ErrorCode,
      body?.message ?? 'Unexpected error',
      body?.statusCode ?? result.status,
    );
  }
}
