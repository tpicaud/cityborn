import type { WorldLocation, WorldLocationSearchResult } from '@cityborn/api';
import {
  WorldLocationSchema,
  WorldLocationSearchResultSchema,
} from '@cityborn/api';
import type {
  WorldLocation as PrismaWorldLocation,
  WorldLocationGeometry as PrismaWorldLocationGeometry,
} from '@prisma/client';
import type { PrismaWorldLocationWithGeometry } from './world-location.mapper';
import { WorldLocationMapper } from './world-location.mapper';

describe('WorldLocationMapper.toWorldLocation', () => {
  it('maps a persisted location with geometry', () => {
    const prismaWorldLocation: PrismaWorldLocation = {
      id: 'location-1',
      osm_type: 'relation',
      external_id: '7444',
      name: 'Paris',
      display_name: 'Paris, France',
      addresstype: 'city',
      centroid: [48.8566, 2.3522],
      source: { provider: 'nominatim', external_id: '7444' },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const prismaWorldLocationGeometry: PrismaWorldLocationGeometry = {
      id: 'geometry-1',
      data: { type: 'Point', coordinates: [2.3522, 48.8566] },
      world_location_id: 'location-1',
    };

    const input: PrismaWorldLocationWithGeometry = {
      ...prismaWorldLocation,
      geometry: prismaWorldLocationGeometry,
    };

    const location: WorldLocation = WorldLocationMapper.toWorldLocation(input);

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
    const input: Parameters<
      typeof WorldLocationMapper.toWorldLocationFromNominatimItem
    >[0] = {
      place_id: '1',
      osm_type: 'relation',
      osm_id: '7444',
      lat: '48.8566',
      lon: '2.3522',
      name: 'Paris',
      display_name: 'Paris, France',
      addresstype: 'city',
      geojson: { type: 'Point', coordinates: [2.3522, 48.8566] },
    };

    const location: WorldLocationSearchResult =
      WorldLocationMapper.toWorldLocationFromNominatimItem(input);

    expect(() => WorldLocationSearchResultSchema.parse(location)).not.toThrow();
    expect(location).toMatchObject({
      id: '7444',
      centroid: [48.8566, 2.3522],
      source: { provider: 'nominatim', external_id: '7444' },
    });
  });

  it('omits an absent address type', () => {
    const input: Parameters<
      typeof WorldLocationMapper.toWorldLocationFromNominatimItem
    >[0] = {
      place_id: '1',
      osm_type: 'relation',
      osm_id: '7444',
      lat: '48.8566',
      lon: '2.3522',
      name: 'Paris',
      display_name: 'Paris, France',
      geojson: { type: 'Point', coordinates: [2.3522, 48.8566] },
    };

    const location: WorldLocationSearchResult =
      WorldLocationMapper.toWorldLocationFromNominatimItem(input);

    expect(location.addresstype).toBeUndefined();
  });
});
