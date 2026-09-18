import {
  buildCategory,
  buildCreateCategory,
  buildGuessObject,
  buildUpdateCategory,
  CategoryIdSchema,
  ErrorCode,
  GuessObjectIdSchema,
} from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import type { GuessObjectService } from '../../guess-object/guess-object.service';
import type { CategoryRepository } from '../repositories/category.repository';
import { CategoryService } from './category.service';

jest.mock('@nestjs-cls/transactional', () => ({
  Transactional:
    () =>
    (
      _target: object,
      _propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ) =>
      descriptor,
}));

const categoryId = (value: string) => CategoryIdSchema.parse(value);
const guessObjectId = (value: string) => GuessObjectIdSchema.parse(value);

function buildCategoryService() {
  const categoryRepository = createMock<CategoryRepository>();
  const guessObjectService = createMock<GuessObjectService>();
  const categoryService = new CategoryService(
    categoryRepository,
    guessObjectService,
  );

  return { categoryRepository, categoryService, guessObjectService };
}

describe('CategoryService queries', () => {
  describe('findTree', () => {
    it('delegates tree filters', async () => {
      const { categoryRepository, categoryService } = buildCategoryService();
      const filter = { isPublished: false };
      categoryRepository.findTree.mockResolvedValue([]);

      await categoryService.findTree(filter);

      expect(categoryRepository.findTree).toHaveBeenCalledWith({
        isPublished: false,
      });
    });
  });

  describe('findAll', () => {
    it('loads every category', async () => {
      const { categoryRepository, categoryService } = buildCategoryService();
      const category = buildCategory();
      categoryRepository.findBy.mockResolvedValue([category]);

      await expect(categoryService.findAll()).resolves.toEqual([category]);
      expect(categoryRepository.findBy).toHaveBeenCalledWith({});
    });
  });

  describe('findBy', () => {
    it('delegates filtered queries', async () => {
      const { categoryRepository, categoryService } = buildCategoryService();
      const filter = { ids: [categoryId('category-1')], isPublished: true };
      categoryRepository.findBy.mockResolvedValue([]);

      await categoryService.findBy(filter);

      expect(categoryRepository.findBy).toHaveBeenCalledWith(filter);
    });
  });

  describe('findFullBy', () => {
    it('delegates full queries', async () => {
      const { categoryRepository, categoryService } = buildCategoryService();
      const filter = { ids: [categoryId('category-1')], isPublished: true };
      categoryRepository.findFullBy.mockResolvedValue([]);

      await categoryService.findFullBy(filter);

      expect(categoryRepository.findFullBy).toHaveBeenCalledWith(filter);
    });
  });
});

describe('CategoryService.create', () => {
  it('delegates creation', async () => {
    const { categoryRepository, categoryService } = buildCategoryService();
    const payload = buildCreateCategory();
    const category = buildCategory();
    categoryRepository.create.mockResolvedValue(category);

    await expect(categoryService.create(payload)).resolves.toEqual(category);
    expect(categoryRepository.create).toHaveBeenCalledWith(payload);
  });
});

describe('CategoryService.update', () => {
  it('updates fields without scanning for orphans', async () => {
    const { categoryRepository, categoryService, guessObjectService } =
      buildCategoryService();
    const payload = buildUpdateCategory({ name: 'Landmarks' });
    const updatedCategory = buildCategory(payload);
    categoryRepository.update.mockResolvedValue(updatedCategory);

    await categoryService.update(categoryId('category-1'), payload);

    expect(categoryRepository.update).toHaveBeenCalledWith(
      categoryId('category-1'),
      payload,
    );
    expect(categoryRepository.countByGuessObjectId).not.toHaveBeenCalled();
    expect(guessObjectService.delete).not.toHaveBeenCalled();
  });

  it('deletes only newly orphaned guess objects', async () => {
    const { categoryRepository, categoryService, guessObjectService } =
      buildCategoryService();
    const orphanId = guessObjectId('guess-orphan');
    const sharedId = guessObjectId('guess-shared');
    const payload = buildUpdateCategory({
      disconnectIds: [orphanId, sharedId],
    });
    const updatedCategory = buildCategory();
    categoryRepository.update.mockResolvedValue(updatedCategory);
    categoryRepository.countByGuessObjectId
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await categoryService.update(categoryId('category-1'), payload);

    expect(guessObjectService.delete).toHaveBeenCalledTimes(1);
    expect(guessObjectService.delete).toHaveBeenCalledWith(orphanId);
  });
});

describe('CategoryService.delete', () => {
  it('rejects when the category does not exist', async () => {
    const { categoryRepository, categoryService } = buildCategoryService();
    categoryRepository.findFullBy.mockResolvedValue([]);

    await expect(
      categoryService.delete(categoryId('missing')),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATEGORY_NOT_FOUND },
    });
  });

  it('rejects when the category has children', async () => {
    const { categoryRepository, categoryService } = buildCategoryService();
    const category = buildCategory();
    categoryRepository.findFullBy.mockResolvedValue([
      { ...category, guessObjects: [] },
    ]);
    categoryRepository.countChildren.mockResolvedValue(1);

    await expect(
      categoryService.delete(categoryId('category-1')),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATEGORY_HAS_CHILDREN },
    });
    expect(categoryRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the category and only its orphaned guess objects', async () => {
    const { categoryRepository, categoryService, guessObjectService } =
      buildCategoryService();
    const orphan = buildGuessObject({ id: 'guess-orphan' });
    const shared = buildGuessObject({ id: 'guess-shared' });
    const category = buildCategory();
    categoryRepository.findFullBy.mockResolvedValue([
      { ...category, guessObjects: [orphan, shared] },
    ]);
    categoryRepository.countChildren.mockResolvedValue(0);
    categoryRepository.countByGuessObjectId
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await categoryService.delete(categoryId('category-1'));

    expect(categoryRepository.delete).toHaveBeenCalledWith(
      categoryId('category-1'),
    );
    expect(guessObjectService.delete).toHaveBeenCalledTimes(1);
    expect(guessObjectService.delete).toHaveBeenCalledWith(orphan.id);
  });
});
