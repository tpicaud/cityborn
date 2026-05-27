import { ErrorCode } from '@cityborn/errors';
import z from 'zod';

export const ApiErrorSchema = z.object({
  code: z.nativeEnum(ErrorCode),
  statusCode: z.number().int(),
  message: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const commonErrorResponses = {
  400: ApiErrorSchema,
  401: ApiErrorSchema,
  403: ApiErrorSchema,
  404: ApiErrorSchema,
  500: ApiErrorSchema,
} as const;
