'use client';

import { roundCountdownInSeconds } from '@cityborn/core';
import { useEffect, useState } from 'react';

const roundTimerTickInMilliseconds: number = 10;
const runningOutThresholdInSeconds: number = 5;

export type RoundTimerOptions = {
  totalTimeInSeconds: number;
  endsAt: number;
};

export type RoundTimer = {
  formattedTimeLeft: string;
  progressPercentage: number;
  isRunningOut: boolean;
  isTimeUp: boolean;
};

type RemainingSecondsOptions = {
  now: number;
  endsAt: number;
  durationInSeconds: number;
};

export function remainingSeconds({
  now,
  endsAt,
  durationInSeconds,
}: RemainingSecondsOptions): number {
  return Math.max(0, Math.min(durationInSeconds, (endsAt - now) / 1000));
}

export function formatTimeLeft(timeLeftInSeconds: number): string {
  const wholeSecondsLeft: number = Math.ceil(timeLeftInSeconds);
  const minutes: number = Math.floor(wholeSecondsLeft / 60);
  const seconds: number = wholeSecondsLeft % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function useRoundTimer({
  totalTimeInSeconds,
  endsAt,
}: RoundTimerOptions): RoundTimer {
  const [now, setNow] = useState<number>(() => performance.now());
  const timeLeftInSeconds: number = remainingSeconds({
    now,
    endsAt,
    durationInSeconds: totalTimeInSeconds,
  });

  useEffect(() => {
    const currentTime: number = performance.now();
    setNow(currentTime);
    if (currentTime >= endsAt) return;

    const intervalId: ReturnType<typeof setInterval> = setInterval(() => {
      const tickTime: number = performance.now();
      setNow(tickTime);
      if (tickTime >= endsAt) clearInterval(intervalId);
    }, roundTimerTickInMilliseconds);

    return () => clearInterval(intervalId);
  }, [endsAt]);

  return {
    formattedTimeLeft: formatTimeLeft(timeLeftInSeconds),
    progressPercentage:
      totalTimeInSeconds > 0
        ? (timeLeftInSeconds / totalTimeInSeconds) * 100
        : 0,
    isRunningOut: timeLeftInSeconds <= runningOutThresholdInSeconds,
    isTimeUp: timeLeftInSeconds === 0,
  };
}

export function useRoundCountdown(
  guessingStartsAt: number | undefined,
): number {
  const [, setTick] = useState<number>(0);
  const now: number = performance.now();

  useEffect(() => {
    if (guessingStartsAt === undefined || guessingStartsAt <= now) return;

    const millisecondsUntilStart: number = guessingStartsAt - now;
    const millisecondsUntilTick: number = millisecondsUntilStart % 1000 || 1000;
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(
      () => setTick((tick) => tick + 1),
      millisecondsUntilTick,
    );
    return () => clearTimeout(timeoutId);
  }, [guessingStartsAt, now]);

  return guessingStartsAt === undefined
    ? 0
    : Math.ceil(
        remainingSeconds({
          now,
          endsAt: guessingStartsAt,
          durationInSeconds: roundCountdownInSeconds,
        }),
      );
}
