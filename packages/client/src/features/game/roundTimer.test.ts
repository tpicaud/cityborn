import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatTimeLeft, remainingSeconds } from './roundTimer';

describe('remainingSeconds', () => {
  it('caps the time at the configured duration before the clock starts', () => {
    const seconds: number = remainingSeconds({
      now: 1_000_000,
      endsAt: 1_028_000,
      durationInSeconds: 25,
    });

    assert.equal(seconds, 25);
  });

  it('keeps only the remaining fraction of the preparation countdown', () => {
    const seconds: number = remainingSeconds({
      now: 1_001_700,
      endsAt: 1_003_000,
      durationInSeconds: 3,
    });

    assert.equal(seconds, 1.3);
  });

  it('keeps only the remaining time when reconnecting during a round', () => {
    const seconds: number = remainingSeconds({
      now: 1_011_500,
      endsAt: 1_028_000,
      durationInSeconds: 25,
    });

    assert.equal(seconds, 16.5);
  });

  it('returns zero after the round expires', () => {
    const seconds: number = remainingSeconds({
      now: 1_030_000,
      endsAt: 1_028_000,
      durationInSeconds: 25,
    });

    assert.equal(seconds, 0);
  });
});

describe('formatTimeLeft', () => {
  it('formats whole seconds as minutes and seconds', () => {
    const formattedTimeLeft: string = formatTimeLeft(65);

    assert.equal(formattedTimeLeft, '1:05');
  });

  it('rounds up to the started second', () => {
    const formattedTimeLeft: string = formatTimeLeft(24.2);

    assert.equal(formattedTimeLeft, '0:25');
  });

  it('shows the last started second until the time is up', () => {
    const formattedTimeLeft: string = formatTimeLeft(0.4);

    assert.equal(formattedTimeLeft, '0:01');
  });
});
