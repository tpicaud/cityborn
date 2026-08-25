import { ErrorCode } from './errors/error-codes';
import { type ApiError, parseApiError } from './schemas/api-error.schema';
import type { HttpSuccessStatus } from './types/http';

export const ApiErrors = {
  refreshFailed: (): ApiError => ({
    code: ErrorCode.USER_REFRESH_FAILED,
    message: 'Refresh failed',
    statusCode: 401,
  }),
  noRefreshToken: (): ApiError => ({
    code: ErrorCode.USER_REFRESH_FAILED,
    message: 'No refresh token available',
    statusCode: 401,
  }),
  googleSignInFailed: (): ApiError => ({
    code: ErrorCode.USER_INVALID_CREDENTIALS,
    message: 'Google sign in failed',
    statusCode: 401,
  }),
  appleSignInFailed: (): ApiError => ({
    code: ErrorCode.USER_INVALID_CREDENTIALS,
    message: 'Apple sign in failed',
    statusCode: 401,
  }),
  appleNoIdentityToken: (): ApiError => ({
    code: ErrorCode.USER_INVALID_CREDENTIALS,
    message: 'Apple did not provide an identity token',
    statusCode: 401,
  }),
} as const;

export function throwOnError<T extends { status: number; body: unknown }>(
  result: T,
): asserts result is Extract<T, { status: HttpSuccessStatus }> {
  if (result.status < 200 || result.status >= 300) {
    throw parseApiError(result.status, result.body);
  }
}
