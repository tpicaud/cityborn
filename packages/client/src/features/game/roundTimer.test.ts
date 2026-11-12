import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRoundTimer, type RoundTimer } from './roundTimer';

describe('createRoundTimer', () => {
  it('rounds up to the started second and keeps the exact remaining share', () => {
    const roundTimer: RoundTimer = createRoundTimer({
      timeLeftInSeconds: 24.2,
      totalTimeInSeconds: 40,
    });

    assert.deepEqual(roundTimer, {
      secondsLeft: 25,
      remainingShare: 0.605,
      urgency: 'calm',
    });
  });

  it('warns from the last ten seconds', () => {
    const roundTimer: RoundTimer = createRoundTimer({
      timeLeftInSeconds: 10,
      totalTimeInSeconds: 30,
    });

    assert.equal(roundTimer.urgency, 'warning');
  });

  it('stays calm just above ten seconds', () => {
    const roundTimer: RoundTimer = createRoundTimer({
      timeLeftInSeconds: 10.01,
      totalTimeInSeconds: 30,
    });

    assert.equal(roundTimer.urgency, 'calm');
  });

  it('becomes critical from the last five seconds', () => {
    const roundTimer: RoundTimer = createRoundTimer({
      timeLeftInSeconds: 5,
      totalTimeInSeconds: 30,
    });

    assert.equal(roundTimer.urgency, 'critical');
  });

  it('reports no time left once the round is over', () => {
    const roundTimer: RoundTimer = createRoundTimer({
      timeLeftInSeconds: 0,
      totalTimeInSeconds: 30,
    });

    assert.deepEqual(roundTimer, {
      secondsLeft: 0,
      remainingShare: 0,
      urgency: 'critical',
    });
  });
});
