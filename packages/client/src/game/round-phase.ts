import { RoundStatus } from '@cityborn/api';

export type RoundPhase = 'countdown' | 'guessing' | 'results';

export function resolveRoundPhase(
  roundStatus: RoundStatus | undefined,
): RoundPhase {
  return roundStatus === RoundStatus.SHOWING_RESULTS ? 'results' : 'countdown';
}

export function shouldResetPreGuess(
  roundStatus: RoundStatus | undefined,
): boolean {
  return roundStatus !== RoundStatus.SHOWING_RESULTS;
}

export function isOverlayVisible(
  phase: RoundPhase,
  roundStatus: RoundStatus | undefined,
): boolean {
  if (phase === 'countdown') return false;
  return !(phase === 'results' && roundStatus === RoundStatus.GUESSING);
}
