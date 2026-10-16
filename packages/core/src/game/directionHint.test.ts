import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Coord } from '@cityborn/api';
import { destination, point } from '@turf/turf';
import { type CardinalDirection, guessDirectionHint } from './directionHint';

const guessCoordinates: Coord = { lat: 48.8566, lng: 2.3522 };

function coordinatesAtBearing(bearingInDegrees: number): Coord {
  const [lng, lat] = destination(
    point([guessCoordinates.lng, guessCoordinates.lat]),
    100,
    bearingInDegrees,
    { units: 'kilometers' },
  ).geometry.coordinates;
  return { lat, lng };
}

describe('guessDirectionHint', () => {
  it('returns the cardinal direction centred on the bearing to the target', () => {
    const bearingsInDegrees: number[] = [0, 45, 90, 135, 180, -135, -90, -45];

    const directions: CardinalDirection[] = bearingsInDegrees.map(
      (bearingInDegrees: number) =>
        guessDirectionHint({
          guessCoordinates,
          targetCoordinates: coordinatesAtBearing(bearingInDegrees),
        }),
    );

    assert.deepEqual(directions, ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
  });

  it('switches direction at the boundary halfway between two cardinal directions', () => {
    const bearingsInDegrees: number[] = [22.4, 22.6, -22.4, -22.6];

    const directions: CardinalDirection[] = bearingsInDegrees.map(
      (bearingInDegrees: number) =>
        guessDirectionHint({
          guessCoordinates,
          targetCoordinates: coordinatesAtBearing(bearingInDegrees),
        }),
    );

    assert.deepEqual(directions, ['N', 'NE', 'N', 'NW']);
  });
});
