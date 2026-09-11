import type { WorldLocation } from '../schemas/world-location.schema';

export function buildWorldLocation(
  overrides: Partial<WorldLocation> = {},
): WorldLocation {
  return structuredClone({
    id: 'location-1',
    osm_type: 'relation',
    name: 'Paris',
    display_name: 'Paris, France',
    addresstype: 'city',
    centroid: [48.8566, 2.3522],
    source: { provider: 'nominatim', external_id: '7444' },
    geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
    ...overrides,
  });
}
