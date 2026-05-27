import { ErrorCode } from './errors/error-codes.js';
import type { ApiError } from './schemas/api-error.schema.js';

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
