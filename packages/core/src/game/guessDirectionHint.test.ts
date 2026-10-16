import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Coord } from '@cityborn/api';
import { destination, point } from '@turf/turf';
import {
  type CardinalDirection,
  guessDirectionHint,
} from './guessDirectionHint';

const guessCoordinates: Coord = { lat: 48.8566, lng: 2.3522 };

function targetAtBearing(bearingInDegrees: number): Coord {
  const [lng, lat] = destination(
    point([guessCoordinates.lng, guessCoordinates.lat]),
    100,
    bearingInDegrees,
    { units: 'kilometers' },
  ).geometry.coordinates;
  return { lat, lng };
}

describe('guessDirectionHint', () => {
  const directionsByBearing: [number, CardinalDirection][] = [
    [0, 'N'],
    [45, 'NE'],
    [90, 'E'],
    [135, 'SE'],
    [180, 'S'],
    [-135, 'SW'],
    [-90, 'W'],
    [-45, 'NW'],
  ];

  directionsByBearing.forEach(([bearingInDegrees, expectedDirection]) => {
    it(`returns ${expectedDirection} when the target lies at a bearing of ${bearingInDegrees}°`, () => {
      const targetCoordinates: Coord = targetAtBearing(bearingInDegrees);

      const direction: CardinalDirection = guessDirectionHint({
        guessCoordinates,
        targetCoordinates,
      });

      assert.equal(direction, expectedDirection);
    });
  });

  it('switches from N to NE at the 22.5° sector boundary', () => {
    const justBeforeBoundary: Coord = targetAtBearing(22.4);
    const justAfterBoundary: Coord = targetAtBearing(22.6);

    const directionBeforeBoundary: CardinalDirection = guessDirectionHint({
      guessCoordinates,
      targetCoordinates: justBeforeBoundary,
    });
    const directionAfterBoundary: CardinalDirection = guessDirectionHint({
      guessCoordinates,
      targetCoordinates: justAfterBoundary,
    });

    assert.equal(directionBeforeBoundary, 'N');
    assert.equal(directionAfterBoundary, 'NE');
  });

  it('returns S when the target lies exactly on the 157.5° boundary between SE and S', () => {
    const targetCoordinates: Coord = targetAtBearing(157.5);

    const direction: CardinalDirection = guessDirectionHint({
      guessCoordinates,
      targetCoordinates,
    });

    assert.equal(direction, 'S');
  });

  it('switches from NW to N at the -22.5° sector boundary', () => {
    const insideNorth: Coord = targetAtBearing(-22.4);
    const insideNorthWest: Coord = targetAtBearing(-22.6);

    const directionInsideNorth: CardinalDirection = guessDirectionHint({
      guessCoordinates,
      targetCoordinates: insideNorth,
    });
    const directionInsideNorthWest: CardinalDirection = guessDirectionHint({
      guessCoordinates,
      targetCoordinates: insideNorthWest,
    });

    assert.equal(directionInsideNorth, 'N');
    assert.equal(directionInsideNorthWest, 'NW');
  });
});
