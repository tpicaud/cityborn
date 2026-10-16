import type { Coord } from '@cityborn/api';
import { point } from '@turf/turf';
import type { Feature, Point } from 'geojson';

export function coordPoint(coord: Coord): Feature<Point> {
  return point([coord.lng, coord.lat]);
}
