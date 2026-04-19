// shared/errorHandler.ts

import { ApiError } from './class/ApiError.js';
import { ErrorCode } from './ErrorCodes.js';
import { ERROR_MESSAGES } from './ErrorMessages.js';

export const getFriendlyErrorMessage = (
  error: ApiError | any,
  lang: 'fr' | 'en' = 'fr',
): string => {
  if (error instanceof ApiError) {
    const code: ErrorCode = error?.code || ErrorCode.UNKNOWN_ERROR;
    return (
      ERROR_MESSAGES[lang][code] ||
      ERROR_MESSAGES[lang][ErrorCode.UNKNOWN_ERROR]
    );
  } else {
    return ERROR_MESSAGES[lang][ErrorCode.UNKNOWN_ERROR];
  }
};
