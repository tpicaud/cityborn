import z from 'zod';
import { ErrorCode } from '../errors/error-codes.js';

export const ApiErrorSchema = z.object({
  code: z.nativeEnum(ErrorCode),
  statusCode: z.number().int(),
  message: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'statusCode' in error &&
    'message' in error
  );
}

export const commonErrorResponses = {
  400: ApiErrorSchema,
  401: ApiErrorSchema,
  403: ApiErrorSchema,
  404: ApiErrorSchema,
  500: ApiErrorSchema,
} as const;
