import {
  type Coord,
  type Game,
  type GuessSubmission,
  RoundStatus,
} from '@cityborn/api';

export type RoundDisplayState = 'countdown' | 'guessing' | 'results';
type RoundStatusValue = NonNullable<Game['state']['currentRound']>['status'];

export function countdownSecondsLeft({
  endAt,
  now,
}: {
  endAt: number;
  now: number;
}): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

export function createTimedOutGuess(
  preGuess: Coord | undefined,
): GuessSubmission {
  return { coordinates: preGuess };
}

export function synchronizeRoundDisplayState(
  roundStatus: RoundStatusValue | undefined,
): Exclude<RoundDisplayState, 'guessing'> {
  return roundStatus === RoundStatus.SHOWING_RESULTS ? 'results' : 'countdown';
}

export function shouldShowRoundOverlay(
  state: RoundDisplayState,
  roundStatus: RoundStatusValue | undefined,
): boolean {
  return (
    state === 'guessing' ||
    (state === 'results' && roundStatus !== RoundStatus.GUESSING)
  );
}
