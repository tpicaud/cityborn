import type {
  Category,
  CreateGuessObject,
  FullGuessObject,
  GuessObject,
  GuessObjectDraft,
  GuessObjectId,
  PatchGuessObject,
  WorldLocation,
} from '@cityborn/api';
import {
  buildCategory,
  buildGuessObject,
  buildWorldLocation,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaGuessObjectRepository } from '../../src/guess-object/repositories/prisma-guess-object.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaGuessObjectRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
  let module: TestingModule;
  let guessObjectRepository: PrismaGuessObjectRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaGuessObjectRepository],
    }).compile();
    await module.init();
    guessObjectRepository = module.get(PrismaGuessObjectRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  describe('create', () => {
    it('persists optional fields and the world location relation', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const createData: CreateGuessObject = {
        name: guessObject.name,
        image: guessObject.image,
        description: guessObject.description,
        short_description: guessObject.short_description,
        source: guessObject.source,
        world_location_id: location.id,
      };
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          geometry: {
            create: {
              data: { type: 'Point', coordinates: [2.3522, 48.8566] },
            },
          },
        },
      });

      const id: GuessObjectId = await guessObjectRepository.create(createData);

      expect(
        await prisma.guessObject.findUnique({ where: { id } }),
      ).toMatchObject({
        name: guessObject.name,
        image: guessObject.image,
        description: guessObject.description,
        short_description: guessObject.short_description,
        source: guessObject.source,
        world_location_id: location.id,
      });
    });
  });

  describe('findByNameAndWorldLocation', () => {
    it('matches both the name and the world location', async () => {
      const location: WorldLocation = buildWorldLocation();
      const otherLocation: WorldLocation = buildWorldLocation({
        id: 'location-2',
        source: { provider: 'nominatim', external_id: '7445' },
      });
      const guessObject: GuessObject = buildGuessObject();
      await prisma.worldLocation.createMany({
        data: [
          {
            id: location.id,
            osm_type: location.osm_type,
            external_id: location.source.external_id,
            name: location.name,
            display_name: location.display_name,
            centroid: location.centroid,
            source: location.source,
          },
          {
            id: otherLocation.id,
            osm_type: otherLocation.osm_type,
            external_id: otherLocation.source.external_id,
            name: otherLocation.name,
            display_name: otherLocation.display_name,
            centroid: otherLocation.centroid,
            source: otherLocation.source,
          },
        ],
      });
      const id: GuessObjectId = await guessObjectRepository.create({
        name: guessObject.name,
        world_location_id: location.id,
      });

      const matching: Pick<GuessObject, 'id'> | null =
        await guessObjectRepository.findByNameAndWorldLocation(
          guessObject.name,
          location.id,
        );
      const elsewhere: Pick<GuessObject, 'id'> | null =
        await guessObjectRepository.findByNameAndWorldLocation(
          guessObject.name,
          otherLocation.id,
        );

      expect(matching).toEqual({ id });
      expect(elsewhere).toBeNull();
    });
  });

  describe('update', () => {
    it('persists changed fields and moves the world location relation', async () => {
      const location: WorldLocation = buildWorldLocation();
      const otherLocation: WorldLocation = buildWorldLocation({
        id: 'location-2',
        source: { provider: 'nominatim', external_id: '7445' },
      });
      const guessObject: GuessObject = buildGuessObject();
      const updateData: PatchGuessObject = {
        name: 'Eiffel Tower Updated',
        description: 'Updated description',
        world_location_id: otherLocation.id,
      };
      await prisma.worldLocation.createMany({
        data: [
          {
            id: location.id,
            osm_type: location.osm_type,
            external_id: location.source.external_id,
            name: location.name,
            display_name: location.display_name,
            centroid: location.centroid,
            source: location.source,
          },
          {
            id: otherLocation.id,
            osm_type: otherLocation.osm_type,
            external_id: otherLocation.source.external_id,
            name: otherLocation.name,
            display_name: otherLocation.display_name,
            centroid: otherLocation.centroid,
            source: otherLocation.source,
          },
        ],
      });
      const id: GuessObjectId = await guessObjectRepository.create({
        name: guessObject.name,
        description: guessObject.description,
        world_location_id: location.id,
      });

      const updatedId: GuessObjectId = await guessObjectRepository.update(
        id,
        updateData,
      );

      expect(updatedId).toBe(id);
      expect(
        await prisma.guessObject.findUnique({ where: { id } }),
      ).toMatchObject({
        name: 'Eiffel Tower Updated',
        description: 'Updated description',
        world_location_id: otherLocation.id,
      });
    });
  });

  describe('delete', () => {
    it('removes the requested guess object', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
        },
      });
      const id: GuessObjectId = await guessObjectRepository.create({
        name: guessObject.name,
        world_location_id: location.id,
      });

      await guessObjectRepository.delete(id);

      expect(await guessObjectRepository.findBy({ ids: [id] })).toEqual([]);
    });
  });

  describe('countByWorldLocationId', () => {
    it('counts only guess objects at the requested location', async () => {
      const location: WorldLocation = buildWorldLocation();
      const otherLocation: WorldLocation = buildWorldLocation({
        id: 'location-2',
        source: { provider: 'nominatim', external_id: '7445' },
      });
      const firstGuessObject: GuessObject = buildGuessObject();
      const secondGuessObject: GuessObject = buildGuessObject({
        id: '00000000-0000-4000-8000-000000000021',
        name: 'Louvre Museum',
      });
      const otherGuessObject: GuessObject = buildGuessObject({
        id: '00000000-0000-4000-8000-000000000022',
        name: 'Arc de Triomphe',
      });
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          guessObjects: {
            create: [
              { id: firstGuessObject.id, name: firstGuessObject.name },
              { id: secondGuessObject.id, name: secondGuessObject.name },
            ],
          },
        },
      });
      await prisma.worldLocation.create({
        data: {
          id: otherLocation.id,
          osm_type: otherLocation.osm_type,
          external_id: otherLocation.source.external_id,
          name: otherLocation.name,
          display_name: otherLocation.display_name,
          centroid: otherLocation.centroid,
          source: otherLocation.source,
          guessObjects: {
            create: { id: otherGuessObject.id, name: otherGuessObject.name },
          },
        },
      });

      const count: number = await guessObjectRepository.countByWorldLocationId(
        location.id,
      );

      expect(count).toBe(2);
    });
  });

  describe('findFullBy', () => {
    it('filters full guess objects by category and includes location geometry', async () => {
      const location: WorldLocation = buildWorldLocation();
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          geometry: {
            create: {
              data: { type: 'Point', coordinates: [2.3522, 48.8566] },
            },
          },
        },
      });
      const guessObject: GuessObject = buildGuessObject();
      const linkedId: GuessObjectId = await guessObjectRepository.create({
        name: guessObject.name,
        source: guessObject.source,
        world_location_id: location.id,
      });
      await guessObjectRepository.create({
        name: 'Louvre Museum',
        world_location_id: location.id,
      });
      const category: Category = buildCategory();
      await prisma.category.create({
        data: {
          id: category.id,
          name: category.name,
          isPublished: category.isPublished,
          guessObjects: { connect: { id: linkedId } },
        },
      });

      const found: FullGuessObject[] = await guessObjectRepository.findFullBy({
        categoryIds: [category.id],
      });

      expect(found.map(({ id }) => id)).toEqual([linkedId]);
      expect(found[0]?.world_location.geometry).toEqual({
        type: 'Point',
        coordinates: [2.3522, 48.8566],
      });
    });

    it('combines identifier and source external identifier filters', async () => {
      const location: WorldLocation = buildWorldLocation();
      const matchingGuessObject: GuessObject = buildGuessObject();
      const differentSource: GuessObject = buildGuessObject({
        id: '00000000-0000-4000-8000-000000000021',
        name: 'Louvre Museum',
        source: { provider: 'wikidata', external_id: 'Q19675' },
      });
      const unselectedGuessObject: GuessObject = buildGuessObject({
        id: '00000000-0000-4000-8000-000000000022',
        name: 'Arc de Triomphe',
      });
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          geometry: {
            create: {
              data: { type: 'Point', coordinates: [2.3522, 48.8566] },
            },
          },
        },
      });
      const matchingId: GuessObjectId = await guessObjectRepository.create({
        name: matchingGuessObject.name,
        source: matchingGuessObject.source,
        world_location_id: location.id,
      });
      const differentSourceId: GuessObjectId =
        await guessObjectRepository.create({
          name: differentSource.name,
          source: differentSource.source,
          world_location_id: location.id,
        });
      await guessObjectRepository.create({
        name: unselectedGuessObject.name,
        source: unselectedGuessObject.source,
        world_location_id: location.id,
      });

      const found: FullGuessObject[] = await guessObjectRepository.findFullBy({
        ids: [matchingId, differentSourceId],
        external_id: 'Q243',
      });

      expect(found.map(({ id }) => id)).toEqual([matchingId]);
    });
  });

  describe('findBy', () => {
    it('combines identifier and source external identifier filters', async () => {
      const location: WorldLocation = buildWorldLocation();
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          geometry: {
            create: {
              data: { type: 'Point', coordinates: [2.3522, 48.8566] },
            },
          },
        },
      });
      const guessObject: GuessObject = buildGuessObject();
      const otherGuessObject: GuessObject = buildGuessObject({
        id: '00000000-0000-4000-8000-000000000021',
        name: 'Louvre Museum',
        source: { provider: 'wikidata', external_id: 'Q19675' },
      });
      const unselectedGuessObject: GuessObject = buildGuessObject({
        id: '00000000-0000-4000-8000-000000000022',
        name: 'Arc de Triomphe',
      });
      const matchingId: GuessObjectId = await guessObjectRepository.create({
        name: guessObject.name,
        source: guessObject.source,
        world_location_id: location.id,
      });
      const otherId: GuessObjectId = await guessObjectRepository.create({
        name: otherGuessObject.name,
        source: otherGuessObject.source,
        world_location_id: location.id,
      });
      await guessObjectRepository.create({
        name: unselectedGuessObject.name,
        source: unselectedGuessObject.source,
        world_location_id: location.id,
      });

      const found: GuessObject[] = await guessObjectRepository.findBy({
        ids: [matchingId, otherId],
        external_id: 'Q243',
      });

      expect(found.map(({ id }) => id)).toEqual([matchingId]);
      expect(found[0]?.world_location_preview).toEqual({
        id: location.id,
        name: 'Paris',
        display_name: 'Paris, France',
      });
    });
  });

  describe('searchDraftByName', () => {
    it('searches drafts by name without case sensitivity', async () => {
      const location: WorldLocation = buildWorldLocation();
      await prisma.worldLocation.create({
        data: {
          id: location.id,
          osm_type: location.osm_type,
          external_id: location.source.external_id,
          name: location.name,
          display_name: location.display_name,
          centroid: location.centroid,
          source: location.source,
          geometry: {
            create: {
              data: { type: 'Point', coordinates: [2.3522, 48.8566] },
            },
          },
        },
      });
      await guessObjectRepository.create({
        name: 'Eiffel Tower',
        world_location_id: location.id,
      });
      await guessObjectRepository.create({
        name: 'Louvre Museum',
        world_location_id: location.id,
      });

      const found: GuessObjectDraft[] =
        await guessObjectRepository.searchDraftByName('eIfFeL');

      expect(found.map(({ name }) => name)).toEqual(['Eiffel Tower']);
    });
  });
});
