import { type ApiError, parseApiError } from './schemas/api-error.schema';
import type { HttpSuccessStatus } from './types/http';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

type SuccessBody<T extends { status: number; body: unknown }> = Extract<
  T,
  { status: HttpSuccessStatus }
>['body'];

export class ApiResponseError extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiResponseError';
    this.apiError = apiError;
  }

  get code(): ApiError['code'] {
    return this.apiError.code;
  }

  get statusCode(): number {
    return this.apiError.statusCode;
  }

  get fieldErrors(): ApiError['fieldErrors'] {
    return this.apiError.fieldErrors;
  }
}

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

function assertSuccess<T extends { status: number; body: unknown }>(
  result: T,
): asserts result is Extract<T, { status: HttpSuccessStatus }> {
  if (!isSuccessStatus(result.status)) {
    throw new ApiResponseError(parseApiError(result.status, result.body));
  }
}

export function toApiResult<T extends { status: number; body: unknown }>(
  result: T,
): ApiResult<SuccessBody<T>> {
  if (!isSuccessStatus(result.status)) {
    return { ok: false, error: parseApiError(result.status, result.body) };
  }
  assertSuccess(result);
  return { ok: true, data: result.body };
}

export function unwrapApiResponse<T extends { status: number; body: unknown }>(
  result: T,
): SuccessBody<T> {
  assertSuccess(result);
  return result.body;
}
