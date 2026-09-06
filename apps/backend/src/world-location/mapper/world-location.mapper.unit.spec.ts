import { WorldLocationSchema } from '@cityborn/api';
import {
  buildPrismaWorldLocation,
  buildPrismaWorldLocationGeometry,
} from '../../../test/support/fixtures';
import { WorldLocationMapper } from './world-location.mapper';

describe('WorldLocationMapper.toWorldLocation', () => {
  it('maps a persisted location with geometry', () => {
    const location = WorldLocationMapper.toWorldLocation({
      ...buildPrismaWorldLocation(),
      geometry: buildPrismaWorldLocationGeometry(),
    });

    expect(() => WorldLocationSchema.parse(location)).not.toThrow();
    expect(location).toMatchObject({
      id: 'location-1',
      geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
      centroid: [48.8566, 2.3522],
    });
  });
});

describe('WorldLocationMapper.toWorldLocationFromNominatimItem', () => {
  it('maps strings, geometry and source identifiers', () => {
    const location = WorldLocationMapper.toWorldLocationFromNominatimItem({
      place_id: '1',
      osm_type: 'relation',
      osm_id: '7444',
      lat: '48.8566',
      lon: '2.3522',
      name: 'Paris',
      display_name: 'Paris, France',
      addresstype: 'city',
      geojson: { type: 'Point', coordinates: [2.3522, 48.8566] },
    });

    expect(() => WorldLocationSchema.parse(location)).not.toThrow();
    expect(location).toMatchObject({
      id: '7444',
      centroid: [48.8566, 2.3522],
      source: { provider: 'nominatim', external_id: '7444' },
    });
  });

  it('omits an absent address type', () => {
    const location = WorldLocationMapper.toWorldLocationFromNominatimItem({
      place_id: '1',
      osm_type: 'relation',
      osm_id: '7444',
      lat: '48.8566',
      lon: '2.3522',
      name: 'Paris',
      display_name: 'Paris, France',
      geojson: { type: 'Point', coordinates: [2.3522, 48.8566] },
    });

    expect(location.addresstype).toBeUndefined();
  });
});
