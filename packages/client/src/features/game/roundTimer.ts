'use client';

import { roundCountdownInSeconds } from '@cityborn/core';
import { useEffect, useRef, useState } from 'react';

const roundTimerTickInMilliseconds: number = 10;
const countdownTickInMilliseconds: number = 1000;
const warningThresholdInSeconds: number = 12;
const criticalThresholdInSeconds: number = 6;

export type RoundTimeLeftOptions = {
  totalTimeInSeconds: number;
  onTimeUp: () => void;
};

export type TimeLeftUrgency = 'calm' | 'warning' | 'critical';

export type RoundTimeLeft = {
  secondsLeft: number;
  remainingShare: number;
  urgency: TimeLeftUrgency;
};

export function createRoundTimeLeft({
  timeLeftInSeconds,
  totalTimeInSeconds,
}: {
  timeLeftInSeconds: number;
  totalTimeInSeconds: number;
}): RoundTimeLeft {
  const secondsLeft: number = Math.ceil(timeLeftInSeconds);
  const urgency: TimeLeftUrgency =
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

export function useRoundTimeLeft({
  totalTimeInSeconds,
  onTimeUp,
}: RoundTimeLeftOptions): RoundTimeLeft {
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

  return createRoundTimeLeft({ timeLeftInSeconds, totalTimeInSeconds });
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
