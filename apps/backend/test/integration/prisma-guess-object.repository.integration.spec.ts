import {
  buildCategory,
  buildGuessObject,
  buildWorldLocation,
  type WorldLocationId,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaGuessObjectRepository } from '../../src/guess-object/repositories/prisma-guess-object.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaGuessObjectRepository', () => {
  const infrastructure = createTestInfrastructure();
  const { prisma } = infrastructure;
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

  async function seedWorldLocation(): Promise<WorldLocationId> {
    const location = buildWorldLocation();
    await prisma.worldLocation.create({
      data: {
        id: location.id,
        osm_type: location.osm_type,
        external_id: location.source.external_id,
        name: location.name,
        display_name: location.display_name,
        centroid: location.centroid,
        source: { provider: 'nominatim', external_id: '7444' },
        geometry: {
          create: {
            data: { type: 'Point', coordinates: [2.3522, 48.8566] },
          },
        },
      },
    });
    return location.id;
  }

  it('filters full guess objects by category and includes location geometry', async () => {
    const worldLocationId = await seedWorldLocation();
    const guessObject = buildGuessObject();
    const linkedId = await guessObjectRepository.create({
      name: guessObject.name,
      source: guessObject.source,
      world_location_id: worldLocationId,
    });
    await guessObjectRepository.create({
      name: 'Louvre Museum',
      world_location_id: worldLocationId,
    });
    const category = buildCategory();
    await prisma.category.create({
      data: {
        id: category.id,
        name: category.name,
        isPublished: category.isPublished,
        guessObjects: { connect: { id: linkedId } },
      },
    });

    const found = await guessObjectRepository.findFullBy({
      categoryIds: [category.id],
    });

    expect(found.map(({ id }) => id)).toEqual([linkedId]);
    expect(found[0]?.world_location.geometry).toEqual({
      type: 'Point',
      coordinates: [2.3522, 48.8566],
    });
  });

  it('filters guess objects by source external identifier', async () => {
    const worldLocationId = await seedWorldLocation();
    const guessObject = buildGuessObject();
    const matchingId = await guessObjectRepository.create({
      name: guessObject.name,
      source: guessObject.source,
      world_location_id: worldLocationId,
    });
    await guessObjectRepository.create({
      name: 'Louvre Museum',
      source: { provider: 'wikidata', external_id: 'Q19675' },
      world_location_id: worldLocationId,
    });

    const found = await guessObjectRepository.findBy({ external_id: 'Q243' });

    expect(found.map(({ id }) => id)).toEqual([matchingId]);
    expect(found[0]?.world_location_preview).toEqual({
      id: worldLocationId,
      name: 'Paris',
      display_name: 'Paris, France',
    });
  });

  it('searches drafts by name without case sensitivity', async () => {
    const worldLocationId = await seedWorldLocation();
    await guessObjectRepository.create({
      name: 'Eiffel Tower',
      world_location_id: worldLocationId,
    });
    await guessObjectRepository.create({
      name: 'Louvre Museum',
      world_location_id: worldLocationId,
    });

    const found = await guessObjectRepository.searchDraftByName('eIfFeL');

    expect(found.map(({ name }) => name)).toEqual(['Eiffel Tower']);
  });
});
