import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRoundTiming, synchronizeRoundTiming } from './gameRound';

describe('createRoundTiming', () => {
  it('resumes an active round using the time remaining on the server', () => {
    const timing: ReturnType<typeof createRoundTiming> = createRoundTiming({
      serverEndsAt: 1_028_000,
      serverTime: 1_010_000,
      receivedAt: 250,
      totalTimeInSeconds: 25,
    });

    assert.deepEqual(timing, {
      serverEndsAt: 1_028_000,
      guessingStartsAt: -6_750,
      endsAt: 18_250,
    });
  });

  it('keeps the elapsed deadline when the server time has passed it', () => {
    const timing: ReturnType<typeof createRoundTiming> = createRoundTiming({
      serverEndsAt: 1_028_000,
      serverTime: 1_029_250,
      receivedAt: 200_000,
      totalTimeInSeconds: 25,
    });

    assert.equal(timing.endsAt, 198_750);
  });

  it('uses the local preparation start when the payload has no deadline', () => {
    const timing: ReturnType<typeof createRoundTiming> = createRoundTiming({
      serverEndsAt: undefined,
      serverTime: undefined,
      receivedAt: 1_010_000,
      totalTimeInSeconds: 25,
    });

    assert.deepEqual(timing, {
      serverEndsAt: undefined,
      guessingStartsAt: 1_013_000,
      endsAt: 1_038_000,
    });
  });
});

describe('synchronizeRoundTiming', () => {
  it('resynchronizes after the local clock pauses during the round', () => {
    const current: ReturnType<typeof createRoundTiming> = createRoundTiming({
      serverEndsAt: 1_028_000,
      serverTime: 1_010_000,
      receivedAt: 250,
      totalTimeInSeconds: 25,
    });
    const incoming: ReturnType<typeof createRoundTiming> = createRoundTiming({
      serverEndsAt: 1_028_000,
      serverTime: 1_026_000,
      receivedAt: 450,
      totalTimeInSeconds: 25,
    });

    const timing: ReturnType<typeof createRoundTiming> = synchronizeRoundTiming(
      {
        current,
        incoming,
        now: 450,
      },
    );

    assert.equal(timing.endsAt, 2_450);
  });

  it('keeps the deadline when an update takes longer to arrive', () => {
    const current: ReturnType<typeof createRoundTiming> = createRoundTiming({
      serverEndsAt: 1_028_000,
      serverTime: 1_010_000,
      receivedAt: 250,
      totalTimeInSeconds: 25,
    });
    const incoming: ReturnType<typeof createRoundTiming> = createRoundTiming({
      serverEndsAt: 1_028_000,
      serverTime: 1_011_000,
      receivedAt: 1_450,
      totalTimeInSeconds: 25,
    });

    const timing: ReturnType<typeof createRoundTiming> = synchronizeRoundTiming(
      {
        current,
        incoming,
        now: 1_450,
      },
    );

    assert.equal(timing, current);
  });
});
