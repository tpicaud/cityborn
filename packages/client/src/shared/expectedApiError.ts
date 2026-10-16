import {
  type ApiError,
  ApiResponseError,
  ErrorCode,
  isApiError,
} from '@cityborn/api';

function toApiError(error: unknown): ApiError | null {
  if (error instanceof ApiResponseError) return error.apiError;
  if (isApiError(error)) return error;
  return null;
}

export function isExpectedApiError(error: unknown): boolean {
  const apiError: ApiError | null = toApiError(error);
  if (!apiError) return false;
  if (apiError.code === ErrorCode.BAD_REQUEST) return false;
  return apiError.statusCode >= 400 && apiError.statusCode < 500;
}
