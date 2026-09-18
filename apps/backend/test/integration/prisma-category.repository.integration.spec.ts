import type {
  Category,
  CategoryTree,
  CreateCategory,
  FullCategory,
  GuessObject,
  UpdateCategory,
  WorldLocation,
} from '@cityborn/api';
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
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const { prisma }: typeof infrastructure = infrastructure;
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

  describe('findBy', () => {
    it('combines identifier and publication filters', async () => {
      const publishedData: CreateCategory = buildCreateCategory({
        name: 'Published',
        isPublished: true,
      });
      const hiddenData: CreateCategory = buildCreateCategory({
        name: 'Hidden',
        isPublished: false,
      });
      const unrelatedData: CreateCategory = buildCreateCategory({
        name: 'Unrelated',
        isPublished: true,
      });
      const published: Category =
        await categoryRepository.create(publishedData);
      const hidden: Category = await categoryRepository.create(hiddenData);
      await categoryRepository.create(unrelatedData);

      const categories: Category[] = await categoryRepository.findBy({
        ids: [published.id, hidden.id],
        isPublished: true,
      });

      expect(categories.map(({ id }) => id)).toEqual([published.id]);
    });
  });

  describe('findFullBy', () => {
    it('loads linked guess objects and applies the publication filter', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const publishedData: CreateCategory = buildCreateCategory({
        name: 'Published',
        isPublished: true,
        guessObjectsIds: [guessObject.id],
      });
      const hiddenData: CreateCategory = buildCreateCategory({
        name: 'Hidden',
        isPublished: false,
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
      const published: Category =
        await categoryRepository.create(publishedData);
      await categoryRepository.create(hiddenData);

      const categories: FullCategory[] = await categoryRepository.findFullBy({
        isPublished: true,
      });

      expect(categories).toMatchObject([
        {
          id: published.id,
          guessObjects: [
            {
              id: guessObject.id,
              world_location_preview: { id: location.id },
            },
          ],
        },
      ]);
    });
  });

  describe('create', () => {
    it('connects a guess object when creating a category', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const categoryData: CreateCategory = buildCreateCategory({
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

      const category: Category = await categoryRepository.create(categoryData);
      const categories: FullCategory[] = await categoryRepository.findFullBy({
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
    it('connects a guess object when updating a category', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const categoryData: CreateCategory = buildCreateCategory();
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
      const category: Category = await categoryRepository.create(categoryData);
      const updateData: UpdateCategory = buildUpdateCategory({
        id: category.id,
        name: 'Connected',
        connectIds: [guessObject.id],
      });

      const updated: Category = await categoryRepository.update(
        category.id,
        updateData,
      );

      expect(updated.name).toBe('Connected');
      expect(
        (
          await categoryRepository.findFullBy({ ids: [category.id] })
        )[0]?.guessObjects.map(({ id }) => id),
      ).toEqual([guessObject.id]);
    });

    it('disconnects a guess object when updating a category', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const categoryData: CreateCategory = buildCreateCategory({
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
      const category: Category = await categoryRepository.create(categoryData);
      const updateData: UpdateCategory = buildUpdateCategory({
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

  describe('countChildren', () => {
    it('counts direct children without counting grandchildren', async () => {
      const parentData: CreateCategory = buildCreateCategory({
        name: 'Parent',
      });
      const parent: Category = await categoryRepository.create(parentData);
      const childData: CreateCategory = buildCreateCategory({
        name: 'Child',
        parentId: parent.id,
      });
      const child: Category = await categoryRepository.create(childData);
      const grandchildData: CreateCategory = buildCreateCategory({
        name: 'Grandchild',
        parentId: child.id,
      });
      await categoryRepository.create(grandchildData);

      const count: number = await categoryRepository.countChildren(parent.id);

      expect(count).toBe(1);
    });
  });

  describe('countByGuessObjectId', () => {
    it('counts only categories linked to the requested guess object', async () => {
      const location: WorldLocation = buildWorldLocation();
      const guessObject: GuessObject = buildGuessObject();
      const otherGuessObject: GuessObject = buildGuessObject({
        id: '00000000-0000-4000-8000-000000000021',
        name: 'Louvre Museum',
      });
      const categoryData: CreateCategory = buildCreateCategory({
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
            create: [
              { id: guessObject.id, name: guessObject.name },
              { id: otherGuessObject.id, name: otherGuessObject.name },
            ],
          },
        },
      });
      await categoryRepository.create(categoryData);

      const linkedCount: number = await categoryRepository.countByGuessObjectId(
        guessObject.id,
      );
      const unlinkedCount: number =
        await categoryRepository.countByGuessObjectId(otherGuessObject.id);

      expect(linkedCount).toBe(1);
      expect(unlinkedCount).toBe(0);
    });
  });

  describe('delete', () => {
    it('removes the requested category', async () => {
      const categoryData: CreateCategory = buildCreateCategory();
      const category: Category = await categoryRepository.create(categoryData);

      await categoryRepository.delete(category.id);

      expect(await categoryRepository.findBy({ ids: [category.id] })).toEqual(
        [],
      );
    });
  });

  describe('findTree', () => {
    it('loads nested categories beneath published roots', async () => {
      const rootData: CreateCategory = buildCreateCategory({
        name: 'Countries',
        isPublished: true,
      });
      const root: Category = await categoryRepository.create(rootData);
      const childData: CreateCategory = buildCreateCategory({
        name: 'France',
        parentId: root.id,
      });
      const child: Category = await categoryRepository.create(childData);
      const hiddenData: CreateCategory = buildCreateCategory({
        name: 'Hidden',
        isPublished: false,
      });
      await categoryRepository.create(hiddenData);

      const tree: CategoryTree[] = await categoryRepository.findTree({
        isPublished: true,
      });

      expect(tree).toMatchObject([
        { id: root.id, name: 'Countries', children: [{ id: child.id }] },
      ]);
    });
  });
});
