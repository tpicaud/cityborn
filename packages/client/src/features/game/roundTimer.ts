'use client';

import { roundCountdownInMilliseconds } from '@cityborn/core';
import { useEffect, useRef, useState } from 'react';
import type { ServerClock } from '../../shared/serverClock/serverClock';
import { useServerClock } from '../../shared/serverClock/serverClockContext';
import { countdownSecondsLeft } from './gameRound';

const roundTimerTickInMilliseconds = 10;
const runningOutThresholdInSeconds = 5;

export type RoundTimerOptions = {
  totalTimeInSeconds: number;
  deadline?: number;
  onTimeUp: () => void;
};

export type RoundTimer = {
  formattedTimeLeft: string;
  progressPercentage: number;
  isRunningOut: boolean;
  isTimeUp: boolean;
};

export function formatTimeLeft(timeLeftInSeconds: number): string {
  const wholeSecondsLeft: number = Math.ceil(timeLeftInSeconds);
  const minutes: number = Math.floor(wholeSecondsLeft / 60);
  const seconds: number = wholeSecondsLeft % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function useRoundTimer({
  totalTimeInSeconds,
  deadline,
  onTimeUp,
}: RoundTimerOptions): RoundTimer {
  const serverClock: ServerClock = useServerClock();
  const [timeLeftInSeconds, setTimeLeftInSeconds] =
    useState<number>(totalTimeInSeconds);
  const onTimeUpRef = useRef<() => void>(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    const fallbackDeadline: number =
      performance.now() + totalTimeInSeconds * 1000;
    const remainingTime: () => number = () =>
      Math.min(
        totalTimeInSeconds,
        Math.max(
          ((serverClock.localDeadline(deadline) ?? fallbackDeadline) -
            performance.now()) /
            1000,
          0,
        ),
      );
    setTimeLeftInSeconds(remainingTime());

    const intervalId = setInterval(() => {
      const nextTimeLeftInSeconds: number = remainingTime();
      setTimeLeftInSeconds(nextTimeLeftInSeconds);
      if (nextTimeLeftInSeconds > 0) return;

      clearInterval(intervalId);
      onTimeUpRef.current();
    }, roundTimerTickInMilliseconds);

    return () => clearInterval(intervalId);
  }, [totalTimeInSeconds, deadline, serverClock]);

  return {
    formattedTimeLeft: formatTimeLeft(timeLeftInSeconds),
    progressPercentage: (timeLeftInSeconds / totalTimeInSeconds) * 100,
    isRunningOut: timeLeftInSeconds <= runningOutThresholdInSeconds,
    isTimeUp: timeLeftInSeconds === 0,
  };
}

export type CountdownOptions = {
  endAt?: number;
  onCountdownEnd: () => void;
};

export type Countdown = {
  count: number;
};

export function useCountdown({
  endAt,
  onCountdownEnd,
}: CountdownOptions): Countdown {
  const serverClock: ServerClock = useServerClock();
  const [count, setCount] = useState<number>(
    Math.ceil(roundCountdownInMilliseconds / 1000),
  );
  const onCountdownEndRef = useRef<() => void>(onCountdownEnd);
  onCountdownEndRef.current = onCountdownEnd;

  useEffect(() => {
    const localEndAt: number =
      serverClock.localDeadline(endAt) ??
      performance.now() + roundCountdownInMilliseconds;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const updateCount = (): void => {
      const now: number = performance.now();
      const remainingMilliseconds: number = Math.max(0, localEndAt - now);
      const nextCount: number = countdownSecondsLeft({
        endAt: localEndAt,
        now,
      });
      setCount(nextCount);
      if (nextCount === 0) {
        onCountdownEndRef.current();
        return;
      }
      timeoutId = setTimeout(
        updateCount,
        Math.max(1, Math.ceil(remainingMilliseconds - (nextCount - 1) * 1000)),
      );
    };

    updateCount();
    return () => clearTimeout(timeoutId);
  }, [endAt, serverClock]);

  return { count };
}
