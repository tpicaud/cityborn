'use client';

import { roundCountdownInSeconds } from '@cityborn/core';
import { useEffect, useRef, useState } from 'react';

const roundTimerTickInMilliseconds = 10;
const countdownTickInMilliseconds = 1000;
const warningThresholdInSeconds = 10;
const criticalThresholdInSeconds = 5;

export type RoundTimerOptions = {
  totalTimeInSeconds: number;
  isRunning: boolean;
  onTimeUp: () => void;
};

export type RoundTimerUrgency = 'calm' | 'warning' | 'critical';

export type RoundTimer = {
  secondsLeft: number;
  remainingShare: number;
  urgency: RoundTimerUrgency;
};

export function createRoundTimer({
  timeLeftInSeconds,
  totalTimeInSeconds,
}: {
  timeLeftInSeconds: number;
  totalTimeInSeconds: number;
}): RoundTimer {
  const secondsLeft: number = Math.ceil(timeLeftInSeconds);
  const urgency: RoundTimerUrgency =
    secondsLeft <= criticalThresholdInSeconds
      ? 'critical'
      : secondsLeft <= warningThresholdInSeconds
        ? 'warning'
        : 'calm';

  return {
    secondsLeft,
    remainingShare:
      totalTimeInSeconds > 0 ? timeLeftInSeconds / totalTimeInSeconds : 0,
    urgency,
  };
}

export function useRoundTimer({
  totalTimeInSeconds,
  isRunning,
  onTimeUp,
}: RoundTimerOptions): RoundTimer {
  const [timeLeftInSeconds, setTimeLeftInSeconds] =
    useState<number>(totalTimeInSeconds);
  const onTimeUpRef = useRef<() => void>(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (!isRunning) return;
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
  }, [isRunning, totalTimeInSeconds]);

  return createRoundTimer({ timeLeftInSeconds, totalTimeInSeconds });
}

export type CountdownOptions = {
  initialCount?: number;
  onCountdownEnd: () => void;
};

export type Countdown = {
  count: number;
};

export function useCountdown({
  initialCount = roundCountdownInSeconds,
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
