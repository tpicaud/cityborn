import z from 'zod';
import { ErrorCode } from '../errors/error-codes';

export const ApiErrorSchema = z.object({
  code: z.nativeEnum(ErrorCode),
  statusCode: z.number().int(),
  message: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export function isApiError(error: unknown): error is ApiError {
  return ApiErrorSchema.safeParse(error).success;
}

export function parseApiError(status: number, body: unknown): ApiError {
  const parsed = ApiErrorSchema.safeParse(body);

  if (parsed.success) {
    return parsed.data;
  }

  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: 'Unexpected error',
    statusCode: status,
  };
}

export const commonErrorResponses = {
  400: ApiErrorSchema,
  401: ApiErrorSchema,
  403: ApiErrorSchema,
  404: ApiErrorSchema,
  409: ApiErrorSchema,
  429: ApiErrorSchema,
  500: ApiErrorSchema,
} as const;
