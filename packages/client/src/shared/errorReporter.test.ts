import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type ApiError, ApiResponseError, ErrorCode } from '@cityborn/api';
import { isExpectedApiError } from './errorReporter';

const sessionNotFoundApiError: ApiError = {
  statusCode: 404,
  code: ErrorCode.RESOURCE_NOT_FOUND,
  message: 'Session not found',
};

const badRequestApiError: ApiError = {
  statusCode: 400,
  code: ErrorCode.BAD_REQUEST,
  message: 'gameConfig.timer: Expected number',
};

const internalServerApiError: ApiError = {
  statusCode: 500,
  code: ErrorCode.UNKNOWN_ERROR,
  message: 'Internal server error',
};

describe('isExpectedApiError', () => {
  it('treats a client API error with a business error code as expected', () => {
    assert.equal(isExpectedApiError(sessionNotFoundApiError), true);
    assert.equal(
      isExpectedApiError(new ApiResponseError(sessionNotFoundApiError)),
      true,
    );
  });

  it('treats a bad request as unexpected', () => {
    assert.equal(isExpectedApiError(badRequestApiError), false);
  });

  it('treats a server API error as unexpected', () => {
    assert.equal(
      isExpectedApiError(new ApiResponseError(internalServerApiError)),
      false,
    );
  });

  it('treats an error that is not an API error as unexpected', () => {
    assert.equal(isExpectedApiError(new Error('Failed to fetch')), false);
  });
});
