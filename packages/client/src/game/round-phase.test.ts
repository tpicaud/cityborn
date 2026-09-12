import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RoundStatus } from '@cityborn/api';
import {
  isOverlayVisible,
  resolveRoundPhase,
  shouldResetPreGuess,
} from './round-phase';

describe('resolveRoundPhase', () => {
  it('shows results while the round is showing them', () => {
    assert.equal(resolveRoundPhase(RoundStatus.SHOWING_RESULTS), 'results');
  });

  it('restarts on the countdown for any other round status', () => {
    assert.equal(resolveRoundPhase(RoundStatus.GUESSING), 'countdown');
    assert.equal(resolveRoundPhase(undefined), 'countdown');
  });
});

describe('shouldResetPreGuess', () => {
  it('keeps the pre-guess while results are shown', () => {
    assert.equal(shouldResetPreGuess(RoundStatus.SHOWING_RESULTS), false);
  });

  it('clears the pre-guess when a new round starts', () => {
    assert.equal(shouldResetPreGuess(RoundStatus.GUESSING), true);
    assert.equal(shouldResetPreGuess(undefined), true);
  });
});

describe('isOverlayVisible', () => {
  it('stays hidden during the countdown', () => {
    assert.equal(isOverlayVisible('countdown', RoundStatus.GUESSING), false);
  });

  it('shows while guessing', () => {
    assert.equal(isOverlayVisible('guessing', RoundStatus.GUESSING), true);
  });

  it('hides stale results when the next round already started', () => {
    assert.equal(isOverlayVisible('results', RoundStatus.GUESSING), false);
  });

  it('shows the results of the current round', () => {
    assert.equal(
      isOverlayVisible('results', RoundStatus.SHOWING_RESULTS),
      true,
    );
  });
});
