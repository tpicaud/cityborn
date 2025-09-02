// shared/errorHandler.ts
import { ERROR_MESSAGES } from './ErrorMessages.js';
import { ErrorCode } from './ErrorCodes.js';
import { ApiError } from './class/ApiError.js';

export const getFriendlyErrorMessage = (error: ApiError, lang: 'fr' | 'en' = 'fr'): string => {
  const code: ErrorCode = error?.code || ErrorCode.UNKNOWN_ERROR;
  return ERROR_MESSAGES[lang][code] || ERROR_MESSAGES[lang][ErrorCode.UNKNOWN_ERROR];
};
