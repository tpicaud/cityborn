import {
  type ApiError,
  getFriendlyErrorMessage,
  isApiError,
} from '@cityborn/api';
import { type AppError, AppErrorCode } from './app-error';

const APP_ERROR_MESSAGES: Record<AppErrorCode, string> = {
  [AppErrorCode.GOOGLE_SIGN_IN_FAILED]: 'La connexion avec Google a échoué.',
  [AppErrorCode.APPLE_SIGN_IN_FAILED]: 'La connexion avec Apple a échoué.',
  [AppErrorCode.APPLE_NO_IDENTITY_TOKEN]:
    "Apple n'a pas fourni de jeton d'identité.",
};

export const AppErrors = {
  googleSignInFailed: (): AppError => ({
    code: AppErrorCode.GOOGLE_SIGN_IN_FAILED,
    message: APP_ERROR_MESSAGES[AppErrorCode.GOOGLE_SIGN_IN_FAILED],
    __brand: 'AppError',
  }),
  appleSignInFailed: (): AppError => ({
    code: AppErrorCode.APPLE_SIGN_IN_FAILED,
    message: APP_ERROR_MESSAGES[AppErrorCode.APPLE_SIGN_IN_FAILED],
    __brand: 'AppError',
  }),
  appleNoIdentityToken: (): AppError => ({
    code: AppErrorCode.APPLE_NO_IDENTITY_TOKEN,
    message: APP_ERROR_MESSAGES[AppErrorCode.APPLE_NO_IDENTITY_TOKEN],
    __brand: 'AppError',
  }),
} as const;

export function toAppError(error: ApiError): AppError {
  return {
    message: getFriendlyErrorMessage(error),
    code: error.code,
    fieldErrors: error.fieldErrors,
    cause: error,
    __brand: 'AppError',
  };
}

export function resolveCaughtError(
  error: unknown,
  fallbackMessage: string,
): AppError | string {
  return isApiError(error) ? toAppError(error) : fallbackMessage;
}
