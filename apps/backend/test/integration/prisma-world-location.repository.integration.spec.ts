import { buildWorldLocation, CreateWorldLocationSchema } from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { PrismaWorldLocationRepository } from '../../src/world-location/repositories/prisma-world-location.repository';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaWorldLocationRepository', () => {
  const infrastructure = createTestInfrastructure();
  const { prisma } = infrastructure;
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

  describe('PrismaWorldLocationRepository.create', () => {
    it('persists location geometry', async () => {
      const data = CreateWorldLocationSchema.parse(buildWorldLocation());

      const location = await worldLocationRepository.create(data);

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
      const data = CreateWorldLocationSchema.parse(buildWorldLocation());
      await worldLocationRepository.create(data);

      await expect(
        worldLocationRepository.create({ ...data, name: 'Another city' }),
      ).rejects.toMatchObject({ code: 'P2002' });
    });
  });

  describe('PrismaWorldLocationRepository.findBySource', () => {
    it('finds a location by OSM identifier with geometry', async () => {
      const data = CreateWorldLocationSchema.parse(buildWorldLocation());
      const location = await worldLocationRepository.create(data);

      const found = await worldLocationRepository.findBySource(
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
  });

  describe('PrismaWorldLocationRepository.delete', () => {
    it('cascades geometry deletion when its location is removed', async () => {
      const location = await worldLocationRepository.create(
        CreateWorldLocationSchema.parse(buildWorldLocation()),
      );

      await worldLocationRepository.delete(location.id);

      expect(
        await worldLocationRepository.findById(location.id, { geometry: true }),
      ).toBeNull();
      expect(await prisma.worldLocationGeometry.count()).toBe(0);
    });
  });
});
