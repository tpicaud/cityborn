import type { Coord } from '@cityborn/api';
import { bearing } from '@turf/turf';
import { coordPoint } from './coordPoint';

export type CardinalDirection =
  | 'N'
  | 'NE'
  | 'E'
  | 'SE'
  | 'S'
  | 'SW'
  | 'W'
  | 'NW';

const cardinalDirections: readonly CardinalDirection[] = [
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
];

const sectorWidthInDegrees: number = 360 / cardinalDirections.length;

export function guessDirectionHint({
  guessCoordinates,
  targetCoordinates,
}: {
  guessCoordinates: Coord;
  targetCoordinates: Coord;
}): CardinalDirection {
  const bearingInDegrees: number = bearing(
    coordPoint(guessCoordinates),
    coordPoint(targetCoordinates),
  );
  const clockwiseBearingInDegrees: number = (bearingInDegrees + 360) % 360;
  const sectorIndex: number =
    Math.round(clockwiseBearingInDegrees / sectorWidthInDegrees) %
    cardinalDirections.length;
  return cardinalDirections[sectorIndex];
}
