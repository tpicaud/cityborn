import assert from 'node:assert/strict';
import test from 'node:test';
import type { WorldLocationId } from './common.schema';
import {
  type WorldLocationSearchResult,
  WorldLocationSearchResultSchema,
} from './world-location.schema';

type IsAssignable<From, To> = From extends To ? true : false;
type AssertFalse<Value extends false> = Value;
type AssertTrue<Value extends true> = Value;

const searchIdentifierAssignability: [
  AssertFalse<IsAssignable<WorldLocationSearchResult['id'], WorldLocationId>>,
  AssertTrue<IsAssignable<WorldLocationId, WorldLocationSearchResult['id']>>,
] = [false, true];

test('external search IDs remain unbranded strings', () => {
  const searchResult = WorldLocationSearchResultSchema.parse({
    id: '7444',
    osm_type: 'relation',
    name: 'Paris',
    display_name: 'Paris, France',
    centroid: [48.8566, 2.3522],
    source: { provider: 'nominatim', external_id: '7444' },
    geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
  });

  assert.deepEqual(searchIdentifierAssignability, [false, true]);
  assert.equal(searchResult.id, '7444');
});
