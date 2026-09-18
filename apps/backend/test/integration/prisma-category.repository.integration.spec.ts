import {
  buildCreateCategory,
  buildGuessObject,
  buildUpdateCategory,
  buildWorldLocation,
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

  describe('create', () => {
    it('connects a guess object when creating a category', async () => {
      const location = buildWorldLocation();
      const guessObject = buildGuessObject();
      const categoryData = buildCreateCategory({
        guessObjectsIds: [guessObject.id],
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
            create: { id: guessObject.id, name: guessObject.name },
          },
        },
      });

      const category = await categoryRepository.create(categoryData);
      const categories = await categoryRepository.findFullBy({
        ids: [category.id],
      });

      expect(categories[0]?.guessObjects.map(({ id }) => id)).toEqual([
        guessObject.id,
      ]);
      expect(
        await categoryRepository.countByGuessObjectId(guessObject.id),
      ).toBe(1);
    });
  });

  describe('update', () => {
    it('disconnects a guess object when updating a category', async () => {
      const location = buildWorldLocation();
      const guessObject = buildGuessObject();
      const categoryData = buildCreateCategory({
        guessObjectsIds: [guessObject.id],
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
            create: { id: guessObject.id, name: guessObject.name },
          },
        },
      });
      const category = await categoryRepository.create(categoryData);
      const updateData = buildUpdateCategory({
        id: category.id,
        disconnectIds: [guessObject.id],
      });

      await categoryRepository.update(category.id, updateData);

      expect(
        await categoryRepository.countByGuessObjectId(guessObject.id),
      ).toBe(0);
      expect(
        (await categoryRepository.findFullBy({ ids: [category.id] }))[0]
          ?.guessObjects,
      ).toEqual([]);
    });
  });

  describe('findTree', () => {
    it('loads nested categories beneath published roots', async () => {
      const rootData = buildCreateCategory({
        name: 'Countries',
        isPublished: true,
      });
      const root = await categoryRepository.create(rootData);
      const childData = buildCreateCategory({
        name: 'France',
        parentId: root.id,
      });
      const child = await categoryRepository.create(childData);
      const hiddenData = buildCreateCategory({
        name: 'Hidden',
        isPublished: false,
      });
      await categoryRepository.create(hiddenData);

      const tree = await categoryRepository.findTree({ isPublished: true });

      expect(tree).toMatchObject([
        { id: root.id, name: 'Countries', children: [{ id: child.id }] },
      ]);
    });
  });
});
