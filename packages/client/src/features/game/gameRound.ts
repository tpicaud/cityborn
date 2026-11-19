import { roundCountdownInSeconds } from '@cityborn/core';

type RoundTiming = {
  serverEndsAt: number | undefined;
  guessingStartsAt: number;
  endsAt: number;
};

type CreateRoundTimingOptions = {
  serverEndsAt: number | undefined;
  serverTime: number | undefined;
  receivedAt: number;
  totalTimeInSeconds: number;
};

type SynchronizeRoundTimingOptions = {
  current: RoundTiming;
  incoming: RoundTiming;
  now: number;
};

export function createRoundTiming({
  serverEndsAt,
  serverTime,
  receivedAt,
  totalTimeInSeconds,
}: CreateRoundTimingOptions): RoundTiming {
  const guessingDuration: number = totalTimeInSeconds * 1000;
  if (serverEndsAt === undefined || serverTime === undefined) {
    const guessingStartsAt: number =
      receivedAt + roundCountdownInSeconds * 1000;
    return {
      serverEndsAt: undefined,
      guessingStartsAt,
      endsAt: guessingStartsAt + guessingDuration,
    };
  }

  const endsAt: number = receivedAt + (serverEndsAt - serverTime);
  return {
    serverEndsAt,
    guessingStartsAt: endsAt - guessingDuration,
    endsAt,
  };
}

export function synchronizeRoundTiming({
  current,
  incoming,
  now,
}: SynchronizeRoundTimingOptions): RoundTiming {
  if (incoming.serverEndsAt === undefined) return current;
  if (
    incoming.serverEndsAt !== current.serverEndsAt ||
    (now < current.endsAt && incoming.endsAt < current.endsAt)
  )
    return incoming;
  return current;
}
