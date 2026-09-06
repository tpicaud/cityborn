import { buildWorldLocation } from '@cityborn/api';
import { createMock } from '../../test/support/createMock';
import {
  buildPrismaWorldLocation,
  buildPrismaWorldLocationWithGeometry,
} from '../../test/support/fixtures';
import type { PrismaService } from '../prisma/prisma.service';
import { WorldLocationService } from './world-location.service';

function buildWorldLocationService() {
  const prismaService = createMock<PrismaService>();
  const worldLocationService = new WorldLocationService(prismaService);

  return { prismaService, worldLocationService };
}

describe('WorldLocationService.get', () => {
  it('returns null when the location does not exist', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(null);

    const location = await worldLocationService.get('missing');

    expect(location).toBeNull();
  });

  it('returns only the identifier', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(
      buildPrismaWorldLocation(),
    );

    const location = await worldLocationService.get('location-1');

    expect(location).toEqual({ id: 'location-1' });
  });
});

describe('WorldLocationService.getWithGeometry', () => {
  it('returns null when the location does not exist', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(null);

    const location = await worldLocationService.getWithGeometry('missing');

    expect(location).toBeNull();
  });

  it('returns the mapped location with geometry', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(
      buildPrismaWorldLocationWithGeometry(),
    );

    const location = await worldLocationService.getWithGeometry('location-1');

    expect(location).toMatchObject({
      id: 'location-1',
      geometry: { type: 'Point' },
    });
  });
});

describe('WorldLocationService.findOrCreate', () => {
  it('returns an existing location without creating a duplicate', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.findUnique.mockResolvedValue(
      buildPrismaWorldLocationWithGeometry(),
    );

    const location = await worldLocationService.findOrCreate(
      buildWorldLocation(),
    );

    expect(location.id).toBe('location-1');
    expect(prismaService.worldLocation.create).not.toHaveBeenCalled();
  });

  it('creates and maps a missing location', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    const payload = buildWorldLocation();
    prismaService.worldLocation.findUnique.mockResolvedValue(null);
    prismaService.worldLocation.create.mockResolvedValue(
      buildPrismaWorldLocationWithGeometry(),
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
    expect(location.id).toBe('location-1');
  });
});

describe('WorldLocationService.delete', () => {
  it('deletes the location', async () => {
    const { prismaService, worldLocationService } = buildWorldLocationService();
    prismaService.worldLocation.delete.mockResolvedValue(
      buildPrismaWorldLocation(),
    );

    await worldLocationService.delete('location-1');

    expect(prismaService.worldLocation.delete).toHaveBeenCalledWith({
      where: { id: 'location-1' },
    });
  });
});
