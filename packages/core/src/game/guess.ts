import type { Coord, FullGuessObject, Guess } from '@cityborn/api';
import { booleanPointInPolygon, distance, point } from '@turf/turf';
import type { MultiPolygon, Polygon, Position } from 'geojson';
import { calculatePoints } from './utils';

export type GuessObjectArea = Polygon | MultiPolygon;

function isPosition(value: unknown): value is Position {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.every((coordinate) => typeof coordinate === 'number')
  );
}

function isClosedLinearRing(value: unknown): value is Position[] {
  if (!Array.isArray(value) || value.length < 4 || !value.every(isPosition)) {
    return false;
  }
  const firstPosition: Position = value[0];
  const lastPosition: Position = value[value.length - 1];
  return firstPosition.every(
    (coordinate, index) => coordinate === lastPosition[index],
  );
}

function isPolygonCoordinates(value: unknown): value is Position[][] {
  return (
    Array.isArray(value) && value.length > 0 && value.every(isClosedLinearRing)
  );
}

export function guessObjectCenter(guessObject: FullGuessObject): Coord {
  const [lat, lng] = guessObject.world_location.centroid;
  return { lat, lng };
}

export function guessObjectArea(
  guessObject: FullGuessObject,
): GuessObjectArea | undefined {
  const { geometry } = guessObject.world_location;
  if (
    geometry.type === 'Polygon' &&
    isPolygonCoordinates(geometry.coordinates)
  ) {
    return { type: 'Polygon', coordinates: geometry.coordinates };
  }
  if (
    geometry.type === 'MultiPolygon' &&
    geometry.coordinates.length > 0 &&
    geometry.coordinates.every(isPolygonCoordinates)
  ) {
    return { type: 'MultiPolygon', coordinates: geometry.coordinates };
  }
  return undefined;
}

export function createGuess(
  guessObject: FullGuessObject,
  coordinates: Coord,
): Guess {
  const guessedPoint = point([coordinates.lng, coordinates.lat]);
  const area: GuessObjectArea | undefined = guessObjectArea(guessObject);
  const win: boolean =
    area !== undefined && booleanPointInPolygon(guessedPoint, area);
  const center: Coord = guessObjectCenter(guessObject);
  const distanceInKm: number = win
    ? 0
    : distance(guessedPoint, point([center.lng, center.lat]), {
        units: 'kilometers',
      });

  return {
    coordinates,
    distance: distanceInKm,
    points: calculatePoints(distanceInKm),
    win,
  };
}
