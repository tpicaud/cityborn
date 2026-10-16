import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiResponseError } from '../protocol/api-response';
import type { ApiError } from '../schemas/api-error.schema';
import { ErrorCode } from './error-codes';
import { resolveErrorMessage } from './error-handler';
import { UserFacingError } from './user-facing-error';

const badRequestApiError: ApiError = {
  statusCode: 400,
  code: ErrorCode.BAD_REQUEST,
  message: 'Cannot save game with this gameMode',
};

describe('resolveErrorMessage', () => {
  it('shows the message of a user-facing error', () => {
    const userFacingError: UserFacingError = new UserFacingError(
      'Objet non valide',
    );

    const errorMessage: string = resolveErrorMessage(userFacingError);

    assert.equal(errorMessage, 'Objet non valide');
  });

  it('shows the friendly message of an API error instead of its technical message', () => {
    const errorMessage: string = resolveErrorMessage(badRequestApiError);

    assert.equal(errorMessage, 'Requête invalide.');
  });

  it('shows the friendly message of an API response error instead of its technical message', () => {
    const apiResponseError: ApiResponseError = new ApiResponseError(
      badRequestApiError,
    );

    const errorMessage: string = resolveErrorMessage(apiResponseError);

    assert.equal(errorMessage, 'Requête invalide.');
  });

  it('shows the generic message instead of the technical message of an error', () => {
    const errorMessage: string = resolveErrorMessage(
      new Error('Failed to fetch'),
    );

    assert.equal(errorMessage, "Quelque chose s'est mal passé.");
  });

  it('shows the generic message for a thrown value that is not an error', () => {
    const errorMessage: string = resolveErrorMessage('socket hang up');

    assert.equal(errorMessage, "Quelque chose s'est mal passé.");
  });

  it('shows the fallback message for an error that is not user-facing', () => {
    const errorMessage: string = resolveErrorMessage(
      new Error('Failed to fetch'),
      'La connexion a échoué.',
    );

    assert.equal(errorMessage, 'La connexion a échoué.');
  });
});
