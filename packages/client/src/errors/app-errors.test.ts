import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type ApiError, ErrorCode } from '@cityborn/api';
import { resolveCaughtError, toAppError } from './app-errors';
import { isAppError } from './app-error';

const apiError: ApiError = {
  code: ErrorCode.USER_INVALID_CREDENTIALS,
  statusCode: 401,
  message: 'Invalid credentials',
  fieldErrors: [{ path: 'password', message: 'Trop court' }],
};

test('toAppError resolves the friendly message from the ErrorCode', () => {
  const appError = toAppError(apiError);

  assert.equal(appError.message, 'Identifiant ou mot de passe incorrect');
});

test('toAppError preserves code, fieldErrors and the original error as cause', () => {
  const appError = toAppError(apiError);

  assert.equal(appError.code, ErrorCode.USER_INVALID_CREDENTIALS);
  assert.deepEqual(appError.fieldErrors, apiError.fieldErrors);
  assert.deepEqual(appError.cause, apiError);
});

test('isAppError rejects a raw ApiError', () => {
  assert.equal(isAppError(apiError), false);
});

test('isAppError accepts a value produced by toAppError', () => {
  assert.equal(isAppError(toAppError(apiError)), true);
});

test('resolveCaughtError converts a caught ApiError into an AppError', () => {
  const resolved = resolveCaughtError(apiError, 'fallback');

  assert.notEqual(resolved, 'fallback');
  if (typeof resolved === 'string') throw new Error('expected an AppError');
  assert.equal(resolved.message, 'Identifiant ou mot de passe incorrect');
});

test('resolveCaughtError returns the fallback message for a non-ApiError', () => {
  const resolved = resolveCaughtError(new Error('boom'), 'fallback');

  assert.equal(resolved, 'fallback');
});
