import {
  defaultGuess,
  type Game,
  type Guess,
  RoundStatus,
} from '@cityborn/api';

export type RoundDisplayState = 'countdown' | 'guessing' | 'results';
type RoundStatusValue = NonNullable<Game['state']['currentRound']>['status'];

export function createTimedOutGuess(preGuess: Guess | undefined): Guess {
  return { ...defaultGuess, ...(preGuess ?? {}) };
}

export function synchronizeRoundDisplayState(
  roundStatus: RoundStatusValue | undefined,
): Exclude<RoundDisplayState, 'guessing'> {
  return roundStatus === RoundStatus.SHOWING_RESULTS ? 'results' : 'countdown';
}

export function shouldShowRoundOverlay(
  displayState: RoundDisplayState,
  roundStatus: RoundStatusValue | undefined,
): boolean {
  return (
    displayState === 'guessing' ||
    (displayState === 'results' && roundStatus !== RoundStatus.GUESSING)
  );
}
