import { ApiResponseError, ErrorCode } from '@cityborn/api';

export type FailedEmailVerificationStatus = 'expired' | 'invalid';

export function toFailedEmailVerificationStatus(
  error: unknown,
): FailedEmailVerificationStatus {
  return error instanceof ApiResponseError &&
    error.code === ErrorCode.USER_VERIFICATION_EMAIL_EXPIRED_TOKEN
    ? 'expired'
    : 'invalid';
}
