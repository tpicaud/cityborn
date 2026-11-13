import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRoundTimeLeft, type RoundTimeLeft } from './roundTimer';

describe('createRoundTimeLeft', () => {
  it('rounds up to the started second and keeps the exact remaining share', () => {
    const roundTimeLeft: RoundTimeLeft = createRoundTimeLeft({
      timeLeftInSeconds: 24.2,
      totalTimeInSeconds: 40,
    });

    assert.deepEqual(roundTimeLeft, {
      secondsLeft: 25,
      remainingShare: 0.605,
    });
  });

  it('reports no time left once the round is over', () => {
    const roundTimeLeft: RoundTimeLeft = createRoundTimeLeft({
      timeLeftInSeconds: 0,
      totalTimeInSeconds: 30,
    });

    assert.deepEqual(roundTimeLeft, {
      secondsLeft: 0,
      remainingShare: 0,
    });
  });
});
