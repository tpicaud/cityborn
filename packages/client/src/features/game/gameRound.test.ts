import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type Coord, type GuessSubmission, RoundStatus } from '@cityborn/api';
import {
  createTimedOutGuess,
  type RoundDisplayState,
  shouldShowRoundOverlay,
  synchronizeRoundDisplayState,
} from './gameRound';

describe('createTimedOutGuess', () => {
  it('submits the coordinates of the pre-guess without a calculated score', () => {
    const preGuess: Coord = { lat: 48.85, lng: 2.35 };

    const timedOutGuess: GuessSubmission = createTimedOutGuess(preGuess);

    assert.deepEqual(timedOutGuess, { coordinates: { lat: 48.85, lng: 2.35 } });
  });

  it('submits no coordinates without a pre-guess', () => {
    const timedOutGuess: GuessSubmission = createTimedOutGuess(undefined);

    assert.deepEqual(timedOutGuess, { coordinates: undefined });
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
