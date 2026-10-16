import type { Coord } from '@cityborn/api';
import { point, rhumbBearing } from '@turf/turf';

const cardinalDirections = [
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
] as const;

export type CardinalDirection = (typeof cardinalDirections)[number];

const sectorAngleInDegrees: number = 360 / cardinalDirections.length;

export function guessDirectionHint({
  guessCoordinates,
  targetCoordinates,
}: {
  guessCoordinates: Coord;
  targetCoordinates: Coord;
}): CardinalDirection {
  const bearingInDegrees: number = rhumbBearing(
    point([guessCoordinates.lng, guessCoordinates.lat]),
    point([targetCoordinates.lng, targetCoordinates.lat]),
  );
  const clockwiseBearingInDegrees: number = (bearingInDegrees + 360) % 360;
  const sectorIndex: number =
    Math.round(clockwiseBearingInDegrees / sectorAngleInDegrees) %
    cardinalDirections.length;
  return cardinalDirections[sectorIndex];
}
