import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ApiResponseError } from '../api-response';
import type { ApiError } from '../schemas/api-error.schema';
import { ErrorCode } from './error-codes';
import { resolveErrorMessage } from './error-handler';

const invalidCredentials: ApiError = {
  code: ErrorCode.USER_INVALID_CREDENTIALS,
  statusCode: 401,
  message: 'Invalid credentials',
};

describe('resolveErrorMessage', () => {
  test('returns a string as-is', () => {
    assert.equal(resolveErrorMessage('Objet non valide'), 'Objet non valide');
  });

  test('maps an ApiError to its friendly message', () => {
    assert.equal(
      resolveErrorMessage(invalidCredentials),
      'Identifiant ou mot de passe incorrect',
    );
  });

  test('maps an ApiResponseError to its friendly message', () => {
    assert.equal(
      resolveErrorMessage(new ApiResponseError(invalidCredentials)),
      'Identifiant ou mot de passe incorrect',
    );
  });

  test('returns the raw message for a BAD_REQUEST (zod recap)', () => {
    assert.equal(
      resolveErrorMessage({
        code: ErrorCode.BAD_REQUEST,
        statusCode: 400,
        message: 'password: Doit contenir au moins une majuscule',
      }),
      'password: Doit contenir au moins une majuscule',
    );
  });

  test('prefers the fallback over a generic Error message', () => {
    assert.equal(
      resolveErrorMessage(new Error('websocket error'), 'Connexion perdue'),
      'Connexion perdue',
    );
  });

  test('uses the Error message when no fallback is given', () => {
    assert.equal(resolveErrorMessage(new Error('boom')), 'boom');
  });

  test('falls back to a generic message for an unknown value', () => {
    assert.equal(
      resolveErrorMessage(undefined),
      "Quelque chose s'est mal passé.",
    );
  });
});
