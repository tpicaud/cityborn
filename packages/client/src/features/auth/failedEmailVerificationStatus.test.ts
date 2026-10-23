import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiResponseError, ErrorCode } from '@cityborn/api';
import {
  type FailedEmailVerificationStatus,
  toFailedEmailVerificationStatus,
} from './failedEmailVerificationStatus';

describe('toFailedEmailVerificationStatus', () => {
  it('returns expired when the verification token has expired', () => {
    const error: ApiResponseError = new ApiResponseError({
      code: ErrorCode.USER_VERIFICATION_EMAIL_EXPIRED_TOKEN,
      message: 'Email verification token is expired',
      statusCode: 401,
    });

    const status: FailedEmailVerificationStatus =
      toFailedEmailVerificationStatus(error);

    assert.equal(status, 'expired');
  });

  it('returns invalid when the verification token is unknown', () => {
    const error: ApiResponseError = new ApiResponseError({
      code: ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN,
      message: 'Email verification token is invalid',
      statusCode: 401,
    });

    const status: FailedEmailVerificationStatus =
      toFailedEmailVerificationStatus(error);

    assert.equal(status, 'invalid');
  });

  it('returns invalid when the request fails without an API error', () => {
    const error: TypeError = new TypeError('Network request failed');

    const status: FailedEmailVerificationStatus =
      toFailedEmailVerificationStatus(error);

    assert.equal(status, 'invalid');
  });
});
