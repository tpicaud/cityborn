import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GameStatus, RoundStatus } from '@cityborn/api';
import {
  type RoundDisplayState,
  shouldShowRoundOverlay,
  synchronizeRoundDisplayState,
} from './gameRound';

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
    const showsOverlay: boolean = shouldShowRoundOverlay({
      state: 'results',
      roundStatus: RoundStatus.GUESSING,
      gameStatus: GameStatus.IN_GAME,
    });

    assert.equal(showsOverlay, false);
  });

  it('shows the results while the server shows them', () => {
    const showsOverlay: boolean = shouldShowRoundOverlay({
      state: 'results',
      roundStatus: RoundStatus.SHOWING_RESULTS,
      gameStatus: GameStatus.IN_GAME,
    });

    assert.equal(showsOverlay, true);
  });

  it('hides the round once the game shows its final results', () => {
    const showsOverlay: boolean = shouldShowRoundOverlay({
      state: 'results',
      roundStatus: RoundStatus.SHOWING_RESULTS,
      gameStatus: GameStatus.IN_RESULTS,
    });

    assert.equal(showsOverlay, false);
  });
});
