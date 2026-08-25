import type { ApiError, Brand, ErrorCode } from '@cityborn/api';

export enum AppErrorCode {
  GOOGLE_SIGN_IN_FAILED = 'GOOGLE_SIGN_IN_FAILED',
  APPLE_SIGN_IN_FAILED = 'APPLE_SIGN_IN_FAILED',
  APPLE_NO_IDENTITY_TOKEN = 'APPLE_NO_IDENTITY_TOKEN',
}

export type AppError = Brand<
  {
    message: string;
    code?: ErrorCode | AppErrorCode;
    cause?: unknown;
    fieldErrors?: ApiError['fieldErrors'];
  },
  'AppError'
>;

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    '__brand' in error &&
    error.__brand === 'AppError'
  );
}
