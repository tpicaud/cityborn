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
      urgency: 'calm',
    });
  });

  it('warns from the last twelve seconds', () => {
    const roundTimeLeft: RoundTimeLeft = createRoundTimeLeft({
      timeLeftInSeconds: 12,
      totalTimeInSeconds: 30,
    });

    assert.equal(roundTimeLeft.urgency, 'warning');
  });

  it('stays calm just above twelve seconds', () => {
    const roundTimeLeft: RoundTimeLeft = createRoundTimeLeft({
      timeLeftInSeconds: 12.01,
      totalTimeInSeconds: 30,
    });

    assert.equal(roundTimeLeft.urgency, 'calm');
  });

  it('becomes critical from the last six seconds', () => {
    const roundTimeLeft: RoundTimeLeft = createRoundTimeLeft({
      timeLeftInSeconds: 6,
      totalTimeInSeconds: 30,
    });

    assert.equal(roundTimeLeft.urgency, 'critical');
  });

  it('reports no time left once the round is over', () => {
    const roundTimeLeft: RoundTimeLeft = createRoundTimeLeft({
      timeLeftInSeconds: 0,
      totalTimeInSeconds: 30,
    });

    assert.deepEqual(roundTimeLeft, {
      secondsLeft: 0,
      remainingShare: 0,
      urgency: 'critical',
    });
  });
});
