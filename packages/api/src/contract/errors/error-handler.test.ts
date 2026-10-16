import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UserFacingError } from '../../errors/user-facing-error';
import { ApiResponseError } from '../api-response';
import type { ApiError } from './api-error.schema';
import { ErrorCode } from './error-codes';
import { getFriendlyErrorMessage, resolveErrorMessage } from './error-handler';

const genericErrorMessage: string = "Quelque chose s'est mal passé.";

const badRequestApiError: ApiError = {
  statusCode: 400,
  code: ErrorCode.BAD_REQUEST,
  message: 'Cannot save game with this gameMode',
};

describe('resolveErrorMessage', () => {
  it('shows the message of a user-facing error', () => {
    assert.equal(
      resolveErrorMessage(new UserFacingError('Objet non valide')),
      'Objet non valide',
    );
  });

  it('shows the friendly message of an API error instead of its technical message', () => {
    const friendlyMessage: string = getFriendlyErrorMessage(badRequestApiError);

    assert.equal(resolveErrorMessage(badRequestApiError), friendlyMessage);
    assert.equal(
      resolveErrorMessage(new ApiResponseError(badRequestApiError)),
      friendlyMessage,
    );
  });

  it('never shows the technical message of an error', () => {
    assert.equal(
      resolveErrorMessage(new Error('Failed to fetch')),
      genericErrorMessage,
    );
    assert.equal(resolveErrorMessage('socket hang up'), genericErrorMessage);
  });

  it('shows the fallback message for an error that is not user-facing', () => {
    assert.equal(
      resolveErrorMessage(
        new Error('Failed to fetch'),
        'La connexion a échoué.',
      ),
      'La connexion a échoué.',
    );
  });
});
