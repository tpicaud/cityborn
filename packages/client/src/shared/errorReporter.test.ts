import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type ApiError, ApiResponseError, ErrorCode } from '@cityborn/api';
import { isExpectedApiError } from './errorReporter';

const sessionNotFoundApiError: ApiError = {
  statusCode: 404,
  code: ErrorCode.RESOURCE_NOT_FOUND,
  message: 'Session not found',
};

describe('isExpectedApiError', () => {
  it('treats a client API error with a business error code as expected', () => {
    const isExpected: boolean = isExpectedApiError(sessionNotFoundApiError);

    assert.equal(isExpected, true);
  });

  it('treats an API response error with a business error code as expected', () => {
    const apiResponseError: ApiResponseError = new ApiResponseError(
      sessionNotFoundApiError,
    );

    const isExpected: boolean = isExpectedApiError(apiResponseError);

    assert.equal(isExpected, true);
  });

  it('treats a bad request as unexpected', () => {
    const badRequestApiError: ApiError = {
      statusCode: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'gameConfig.timer: Expected number',
    };

    const isExpected: boolean = isExpectedApiError(badRequestApiError);

    assert.equal(isExpected, false);
  });

  it('treats a server API error as unexpected', () => {
    const internalServerError: ApiResponseError = new ApiResponseError({
      statusCode: 500,
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Internal server error',
    });

    const isExpected: boolean = isExpectedApiError(internalServerError);

    assert.equal(isExpected, false);
  });

  it('treats an error that is not an API error as unexpected', () => {
    const isExpected: boolean = isExpectedApiError(
      new Error('Failed to fetch'),
    );

    assert.equal(isExpected, false);
  });
});
