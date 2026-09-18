import type {
  Category,
  FullGuessObject,
  GuessObject,
  GuessObjectDraft,
  GuessObjectId,
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
  });

  describe('findBy', () => {
    it('filters guess objects by source external identifier', async () => {
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
      const matchingId: GuessObjectId = await guessObjectRepository.create({
        name: guessObject.name,
        source: guessObject.source,
        world_location_id: location.id,
      });
      await guessObjectRepository.create({
        name: 'Louvre Museum',
        source: { provider: 'wikidata', external_id: 'Q19675' },
        world_location_id: location.id,
      });

      const found: GuessObject[] = await guessObjectRepository.findBy({
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
