import { buildWorldLocation, WorldLocationIdSchema } from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import type {
  WorldLocation as PrismaWorldLocation,
  WorldLocationGeometry as PrismaWorldLocationGeometry,
} from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { PrismaWorldLocationWithGeometry } from './mapper/world-location.mapper';
import { WorldLocationService } from './world-location.service';

const worldLocationId = (value: string) => WorldLocationIdSchema.parse(value);

const prismaWorldLocation = {
  id: worldLocationId('location-1'),
  osm_type: 'relation',
  external_id: '7444',
  name: 'Paris',
  display_name: 'Paris, France',
  addresstype: 'city',
  centroid: [48.8566, 2.3522],
  source: { provider: 'nominatim', external_id: '7444' },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
} satisfies PrismaWorldLocation;

const prismaWorldLocationGeometry = {
  id: 'geometry-1',
  data: { type: 'Point', coordinates: [2.3522, 48.8566] },
  world_location_id: worldLocationId('location-1'),
} satisfies PrismaWorldLocationGeometry;

const prismaWorldLocationWithGeometry = {
  ...prismaWorldLocation,
  geometry: prismaWorldLocationGeometry,
} satisfies PrismaWorldLocationWithGeometry;

function buildWorldLocationService() {
  const prismaService = createMock<PrismaService>();
  const worldLocationService = new WorldLocationService(prismaService);

  return { prismaService, worldLocationService };
}

describe('WorldLocationService.get', () => {
  it('returns null when the location does not exist', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(null);

    const location = await worldLocationService.get(worldLocationId('missing'));

    expect(location).toBeNull();
  });

  it('returns only the identifier', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(
      prismaWorldLocation,
    );

    const location = await worldLocationService.get(
      worldLocationId('location-1'),
    );

    expect(location).toEqual({ id: worldLocationId('location-1') });
  });
});

describe('WorldLocationService.getWithGeometry', () => {
  it('returns null when the location does not exist', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(null);

    const location = await worldLocationService.getWithGeometry(
      worldLocationId('missing'),
    );

    expect(location).toBeNull();
  });

  it('returns the mapped location with geometry', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(
      prismaWorldLocationWithGeometry,
    );

    const location = await worldLocationService.getWithGeometry(
      worldLocationId('location-1'),
    );

    expect(location).toMatchObject({
      id: worldLocationId('location-1'),
      geometry: { type: 'Point' },
    });
  });
});

describe('WorldLocationService.findByExternalIdentifier', () => {
  it('queries the external identifier without branding it as a persisted ID', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(
      prismaWorldLocationWithGeometry,
    );

    const location = await worldLocationService.findByExternalIdentifier(
      'relation',
      '7444',
    );

    expect(prismaService.worldLocation.findUnique).toHaveBeenCalledWith({
      where: {
        osm_type_external_id: {
          osm_type: 'relation',
          external_id: '7444',
        },
      },
      include: { geometry: true },
    });
    expect(location?.id).toBe(worldLocationId('location-1'));
  });
});

describe('WorldLocationService.findOrCreate', () => {
  it('returns an existing location without creating a duplicate', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(
      prismaWorldLocationWithGeometry,
    );

    const location = await worldLocationService.findOrCreate(
      buildWorldLocation(),
    );

    expect(location.id).toBe(worldLocationId('location-1'));
    expect(prismaService.worldLocation.create).not.toHaveBeenCalled();
  });

  it('creates and maps a missing location', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    const payload = buildWorldLocation();
    prismaService.worldLocation.findUnique.mockResolvedValue(null);
    prismaService.worldLocation.create.mockResolvedValue(
      prismaWorldLocationWithGeometry,
    );

    const location = await worldLocationService.findOrCreate(payload);

    expect(prismaService.worldLocation.create).toHaveBeenCalledWith({
      data: {
        osm_type: payload.osm_type,
        external_id: payload.source.external_id,
        name: payload.name,
        geometry: { create: { data: payload.geometry } },
        display_name: payload.display_name,
        addresstype: payload.addresstype,
        centroid: payload.centroid,
        source: payload.source,
      },
      include: { geometry: true },
    });
    expect(location.id).toBe(worldLocationId('location-1'));
  });
});

describe('WorldLocationService.delete', () => {
  it('deletes the location', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.delete.mockResolvedValue(prismaWorldLocation);

    await worldLocationService.delete(worldLocationId('location-1'));

    expect(prismaService.worldLocation.delete).toHaveBeenCalledWith({
      where: { id: worldLocationId('location-1') },
    });
  });
});
