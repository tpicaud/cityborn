import type { Coord, GuessSubmission } from '@cityborn/api';

export function createGuessSubmission(
  coordinates: Coord | undefined,
): GuessSubmission {
  return coordinates ? { coordinates } : {};
}
