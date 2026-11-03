import { type Game, RoundStatus } from '@cityborn/api';

export type RoundDisplayState = 'countdown' | 'guessing' | 'results';
type RoundStatusValue = NonNullable<Game['state']['currentRound']>['status'];

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
