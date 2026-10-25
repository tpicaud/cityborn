'use client';

import { useEffect, useRef, useState } from 'react';
import type { ServerClock } from '../../shared/serverClock/serverClock';
import { useServerClock } from '../../shared/serverClock/serverClockContext';

const roundTimerTickInMilliseconds = 10;
const countdownTickInMilliseconds = 1000;
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
  initialCount?: number;
  onCountdownEnd: () => void;
};

export type Countdown = {
  count: number;
};

export function useCountdown({
  initialCount = 3,
  onCountdownEnd,
}: CountdownOptions): Countdown {
  const [count, setCount] = useState<number>(initialCount);

  useEffect(() => {
    if (count <= 0) {
      onCountdownEnd();
      return;
    }

    const timeoutId = setTimeout(
      () => setCount((previousCount) => previousCount - 1),
      countdownTickInMilliseconds,
    );
    return () => clearTimeout(timeoutId);
  }, [count, onCountdownEnd]);

  return { count };
}
