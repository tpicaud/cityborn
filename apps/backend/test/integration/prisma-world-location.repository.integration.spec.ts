import type {
  CreateWorldLocation,
  WorldLocation,
  WorldLocationSource,
} from '@cityborn/api';
import { buildWorldLocation, CreateWorldLocationSchema } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { PrismaWorldLocationRepository } from '../../src/world-location/repositories/prisma-world-location.repository';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaWorldLocationRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let worldLocationRepository: PrismaWorldLocationRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaWorldLocationRepository],
    }).compile();
    await module.init();
    worldLocationRepository = module.get(PrismaWorldLocationRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  describe('existsById', () => {
    it('distinguishes a persisted location from an absent one', async () => {
      const locationData: WorldLocation = buildWorldLocation();
      const absentLocation: WorldLocation = buildWorldLocation({
        id: 'location-missing',
      });
      const createData: CreateWorldLocation =
        CreateWorldLocationSchema.parse(locationData);
      const location: WorldLocation =
        await worldLocationRepository.create(createData);

      const exists: boolean = await worldLocationRepository.existsById(
        location.id,
      );
      const absent: boolean = await worldLocationRepository.existsById(
        absentLocation.id,
      );

      expect(exists).toBe(true);
      expect(absent).toBe(false);
    });
  });

  describe('findById', () => {
    it('loads a persisted location with geometry', async () => {
      const locationData: WorldLocation = buildWorldLocation();
      const createData: CreateWorldLocation =
        CreateWorldLocationSchema.parse(locationData);
      const location: WorldLocation =
        await worldLocationRepository.create(createData);

      const withGeometry: WorldLocation | null =
        await worldLocationRepository.findById(location.id, { geometry: true });

      expect(withGeometry?.geometry).toEqual({
        type: 'Point',
        coordinates: [2.3522, 48.8566],
      });
    });

    it('returns null for an unknown identifier', async () => {
      const absentLocation: WorldLocation = buildWorldLocation();

      const found: WorldLocation | null =
        await worldLocationRepository.findById(absentLocation.id, {
          geometry: true,
        });

      expect(found).toBeNull();
    });
  });

  describe('create', () => {
    it('persists location geometry', async () => {
      const locationData: WorldLocation = buildWorldLocation();
      const createData: CreateWorldLocation =
        CreateWorldLocationSchema.parse(locationData);

      const location: WorldLocation =
        await worldLocationRepository.create(createData);

      expect(location).toMatchObject({
        name: 'Paris',
        centroid: [48.8566, 2.3522],
        geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
      });
      expect(
        await prisma.worldLocationGeometry.count({
          where: { world_location_id: location.id },
        }),
      ).toBe(1);
    });

    it('rejects duplicate OSM identifiers', async () => {
      const locationData: WorldLocation = buildWorldLocation();
      const createData: CreateWorldLocation =
        CreateWorldLocationSchema.parse(locationData);
      const duplicateData: CreateWorldLocation = {
        ...createData,
        name: 'Another city',
      };
      await worldLocationRepository.create(createData);

      await expect(
        worldLocationRepository.create(duplicateData),
      ).rejects.toMatchObject({ code: 'P2002' });
    });
  });

  describe('findBySource', () => {
    it('finds a location by OSM identifier with geometry', async () => {
      const locationData: WorldLocation = buildWorldLocation();
      const createData: CreateWorldLocation =
        CreateWorldLocationSchema.parse(locationData);
      const location: WorldLocation =
        await worldLocationRepository.create(createData);

      const found: WorldLocation | null =
        await worldLocationRepository.findBySource(
          { provider: 'relation', external_id: '7444' },
          { geometry: true },
        );

      expect(found).toMatchObject({
        id: location.id,
        name: 'Paris',
        centroid: [48.8566, 2.3522],
        geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
      });
    });

    it('requires both the OSM type and external identifier to match', async () => {
      const locationData: WorldLocation = buildWorldLocation();
      const createData: CreateWorldLocation =
        CreateWorldLocationSchema.parse(locationData);
      const source: WorldLocationSource = {
        provider: 'node',
        external_id: locationData.source.external_id,
      };
      await worldLocationRepository.create(createData);

      const found: WorldLocation | null =
        await worldLocationRepository.findBySource(source, { geometry: true });

      expect(found).toBeNull();
    });
  });

  describe('delete', () => {
    it('cascades geometry deletion when its location is removed', async () => {
      const locationData: WorldLocation = buildWorldLocation();
      const createData: CreateWorldLocation =
        CreateWorldLocationSchema.parse(locationData);
      const location: WorldLocation =
        await worldLocationRepository.create(createData);

      await worldLocationRepository.delete(location.id);

      expect(
        await worldLocationRepository.findById(location.id, { geometry: true }),
      ).toBeNull();
      expect(await prisma.worldLocationGeometry.count()).toBe(0);
    });
  });
});
