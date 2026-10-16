import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildGuess, type Guess, RoundStatus } from '@cityborn/api';
import {
  createTimedOutGuess,
  type RoundDisplayState,
  shouldShowRoundOverlay,
  synchronizeRoundDisplayState,
} from './gameRound';

describe('createTimedOutGuess', () => {
  it('keeps the pre-guess', () => {
    const preGuess: Guess = buildGuess({
      coordinates: { lat: 48.85, lng: 2.35 },
      distance: 10,
      points: 900,
      win: false,
    });

    const timedOutGuess: Guess = createTimedOutGuess(preGuess);

    assert.deepEqual(timedOutGuess, {
      coordinates: { lat: 48.85, lng: 2.35 },
      distance: 10,
      points: 900,
      win: false,
    });
  });

  it('falls back to an empty guess without a pre-guess', () => {
    const timedOutGuess: Guess = createTimedOutGuess(undefined);

    assert.deepEqual(timedOutGuess, {
      coordinates: { lat: 0, lng: 0 },
      distance: -1,
      points: 0,
      win: false,
    });
  });
});

describe('synchronizeRoundDisplayState', () => {
  it('shows the results of a round showing its results', () => {
    const displayState: RoundDisplayState = synchronizeRoundDisplayState(
      RoundStatus.SHOWING_RESULTS,
    );

    assert.equal(displayState, 'results');
  });

  it('starts the countdown of a guessing round', () => {
    const displayState: RoundDisplayState = synchronizeRoundDisplayState(
      RoundStatus.GUESSING,
    );

    assert.equal(displayState, 'countdown');
  });

  it('starts the countdown without a round', () => {
    const displayState: RoundDisplayState =
      synchronizeRoundDisplayState(undefined);

    assert.equal(displayState, 'countdown');
  });
});

describe('shouldShowRoundOverlay', () => {
  it('hides the results once the server starts the next round', () => {
    const showsOverlay: boolean = shouldShowRoundOverlay(
      'results',
      RoundStatus.GUESSING,
    );

    assert.equal(showsOverlay, false);
  });

  it('shows the results while the server shows them', () => {
    const showsOverlay: boolean = shouldShowRoundOverlay(
      'results',
      RoundStatus.SHOWING_RESULTS,
    );

    assert.equal(showsOverlay, true);
  });
});
