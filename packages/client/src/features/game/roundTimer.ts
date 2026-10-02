'use client';

import { useEffect, useRef, useState } from 'react';

const roundTimerTickInMilliseconds = 10;
const countdownTickInMilliseconds = 1000;
const runningOutThresholdInSeconds = 5;

export type RoundTimerOptions = {
  totalTimeInSeconds: number;
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
  onTimeUp,
}: RoundTimerOptions): RoundTimer {
  const [timeLeftInSeconds, setTimeLeftInSeconds] =
    useState<number>(totalTimeInSeconds);
  const onTimeUpRef = useRef<() => void>(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    const startTime: number = Date.now();
    setTimeLeftInSeconds(totalTimeInSeconds);

    const intervalId = setInterval(() => {
      const elapsedTimeInSeconds: number = (Date.now() - startTime) / 1000;
      const nextTimeLeftInSeconds: number = Math.max(
        totalTimeInSeconds - elapsedTimeInSeconds,
        0,
      );
      setTimeLeftInSeconds(nextTimeLeftInSeconds);
      if (nextTimeLeftInSeconds > 0) return;

      clearInterval(intervalId);
      onTimeUpRef.current();
    }, roundTimerTickInMilliseconds);

    return () => clearInterval(intervalId);
  }, [totalTimeInSeconds]);

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

export function useCountdown({
  initialCount = 3,
  onCountdownEnd,
}: CountdownOptions): number {
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

  return count;
}
