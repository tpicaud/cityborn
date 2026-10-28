import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { GuessSubmission } from '@cityborn/api';
import { createGuessSubmission } from './guessSubmission';

describe('createGuessSubmission', () => {
  it('submits the coordinates of a placed guess', () => {
    const submission: GuessSubmission = createGuessSubmission({
      lat: 48.85,
      lng: 2.35,
    });

    assert.deepEqual(submission, { coordinates: { lat: 48.85, lng: 2.35 } });
  });

  it('submits a guess without coordinates when nothing is placed', () => {
    const submission: GuessSubmission = createGuessSubmission(undefined);

    assert.deepEqual(submission, {});
  });
});
