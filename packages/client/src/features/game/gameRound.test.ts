import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RoundStatus } from '@cityborn/api';
import {
  createTimedOutGuess,
  shouldShowRoundOverlay,
  synchronizeRoundDisplayState,
} from './gameRound';

test('createTimedOutGuess conserve le pré-guess ou utilise le guess vide', () => {
  assert.deepEqual(createTimedOutGuess(undefined), {
    coordinates: { lat: 0, lng: 0 },
    distance: -1,
    points: 0,
    win: false,
  });
  assert.deepEqual(
    createTimedOutGuess({
      coordinates: { lat: 48.85, lng: 2.35 },
      distance: 10,
      points: 900,
      win: false,
    }),
    {
      coordinates: { lat: 48.85, lng: 2.35 },
      distance: 10,
      points: 900,
      win: false,
    },
  );
});

test('le flow de round synchronise les transitions serveur', () => {
  assert.equal(
    synchronizeRoundDisplayState(RoundStatus.SHOWING_RESULTS),
    'results',
  );
  assert.equal(synchronizeRoundDisplayState(RoundStatus.GUESSING), 'countdown');
  assert.equal(synchronizeRoundDisplayState(undefined), 'countdown');
  assert.equal(shouldShowRoundOverlay('results', RoundStatus.GUESSING), false);
  assert.equal(
    shouldShowRoundOverlay('results', RoundStatus.SHOWING_RESULTS),
    true,
  );
});
