import {
  buildCreateCategory,
  buildGuessObject,
  buildUpdateCategory,
} from '@cityborn/api';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaCategoryRepository } from '../../src/category/repositories/prisma-category.repository';
import { PrismaClsModule } from '../../src/prisma/prisma-cls.module';
import { createTestInfrastructure } from '../support/infrastructure';

describe('PrismaCategoryRepository', () => {
  const infrastructure = createTestInfrastructure();
  const { prisma } = infrastructure;
  let module: TestingModule;
  let categoryRepository: PrismaCategoryRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaClsModule],
      providers: [PrismaCategoryRepository],
    }).compile();
    await module.init();
    categoryRepository = module.get(PrismaCategoryRepository);
  });

  afterAll(async () => {
    await module?.close();
    await infrastructure.close();
  });

  async function seedGuessObject() {
    const guessObject = buildGuessObject();
    await prisma.worldLocation.create({
      data: {
        osm_type: 'relation',
        external_id: '7444',
        name: 'Paris',
        display_name: 'Paris, France',
        centroid: [48.8566, 2.3522],
        source: { provider: 'nominatim', external_id: '7444' },
        guessObjects: {
          create: { id: guessObject.id, name: guessObject.name },
        },
      },
    });
    return guessObject;
  }

  it('connects a guess object when creating a category', async () => {
    const guessObject = await seedGuessObject();

    const category = await categoryRepository.create(
      buildCreateCategory({ guessObjectsIds: [guessObject.id] }),
    );
    const categories = await categoryRepository.findFullBy({
      ids: [category.id],
    });

    expect(categories[0]?.guessObjects.map(({ id }) => id)).toEqual([
      guessObject.id,
    ]);
    expect(await categoryRepository.countByGuessObjectId(guessObject.id)).toBe(
      1,
    );
  });

  it('disconnects a guess object when updating a category', async () => {
    const guessObject = await seedGuessObject();
    const category = await categoryRepository.create(
      buildCreateCategory({ guessObjectsIds: [guessObject.id] }),
    );

    await categoryRepository.update(
      category.id,
      buildUpdateCategory({ id: category.id, disconnectIds: [guessObject.id] }),
    );

    expect(await categoryRepository.countByGuessObjectId(guessObject.id)).toBe(
      0,
    );
    expect(
      (await categoryRepository.findFullBy({ ids: [category.id] }))[0]
        ?.guessObjects,
    ).toEqual([]);
  });

  it('loads nested categories beneath published roots', async () => {
    const root = await categoryRepository.create(
      buildCreateCategory({ name: 'Countries', isPublished: true }),
    );
    const child = await categoryRepository.create(
      buildCreateCategory({ name: 'France', parentId: root.id }),
    );
    await categoryRepository.create(
      buildCreateCategory({ name: 'Hidden', isPublished: false }),
    );

    const tree = await categoryRepository.findTree({ isPublished: true });

    expect(tree).toMatchObject([
      { id: root.id, name: 'Countries', children: [{ id: child.id }] },
    ]);
  });
});
