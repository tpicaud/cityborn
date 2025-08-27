// shared/errorHandler.ts
import { ERROR_MESSAGES } from './ErrorMessages.js';
import { ErrorCode } from './ErrorCodes.js';
import { ApiError } from './class/ApiError.js';

export const getFriendlyErrorMessage = (error: ApiError): string => {
  const code: ErrorCode = error?.code || ErrorCode.UNKNOWN_ERROR;
  return ERROR_MESSAGES.fr[code] || ERROR_MESSAGES.fr[ErrorCode.UNKNOWN_ERROR];
};
