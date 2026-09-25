import z from 'zod';
import { ErrorCode } from '../errors/error-codes';

export const ApiErrorSchema = z.object({
  code: z.nativeEnum(ErrorCode),
  statusCode: z.number().int(),
  message: z.string(),
  fieldErrors: z
    .array(z.object({ path: z.string(), message: z.string() }))
    .optional(),
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

const {
  USER_PASSWORD_RESET_INVALID_TOKEN: passwordResetInvalidTokenCode,
  ...commonErrorCodes
} = ErrorCode;

const CommonApiErrorSchema = ApiErrorSchema.extend({
  code: z.nativeEnum(commonErrorCodes),
});

export const PasswordResetTokenErrorSchema = ApiErrorSchema.extend({
  code: z.literal(passwordResetInvalidTokenCode),
  statusCode: z.literal(401),
});

export const commonErrorResponses = {
  400: CommonApiErrorSchema,
  401: CommonApiErrorSchema,
  403: CommonApiErrorSchema,
  404: CommonApiErrorSchema,
  409: CommonApiErrorSchema,
  429: CommonApiErrorSchema,
  500: CommonApiErrorSchema,
} as const;
