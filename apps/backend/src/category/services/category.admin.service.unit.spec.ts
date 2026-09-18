import type {
  Category,
  CategoryId,
  CategoryTree,
  CreateCategory,
  FullCategory,
  UpdateCategory,
} from '@cityborn/api';
import {
  buildCategory,
  buildCreateCategory,
  buildUpdateCategory,
  CategoryIdSchema,
  ErrorCode,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { CategoryFilter } from '../repositories/category.repository';
import { AdminCategoryService } from './category.admin.service';
import type { CategoryService } from './category.service';

const categoryId: (value: string) => CategoryId = (value: string) =>
  CategoryIdSchema.parse(value);

function buildAdminCategoryService() {
  const categoryService: DeepMocked<CategoryService> =
    createMock<CategoryService>();
  const adminCategoryService: AdminCategoryService = new AdminCategoryService(
    categoryService,
  );

  return { adminCategoryService, categoryService };
}

describe('AdminCategoryService.findAll', () => {
  it('returns every mapped category', async () => {
    const {
      adminCategoryService,
      categoryService,
    }: ReturnType<typeof buildAdminCategoryService> =
      buildAdminCategoryService();
    const category: Category = buildCategory();
    const otherCategory: Category = buildCategory({ id: 'category-2' });
    categoryService.findAll.mockResolvedValue([category, otherCategory]);

    const categories: Category[] = await adminCategoryService.findAll();

    expect(categories.map(({ id }) => id)).toEqual([
      '00000000-0000-4000-8000-000000000010',
      'category-2',
    ]);
  });
});

describe('AdminCategoryService.findBy', () => {
  it('forwards the filter and returns mapped categories', async () => {
    const {
      adminCategoryService,
      categoryService,
    }: ReturnType<typeof buildAdminCategoryService> =
      buildAdminCategoryService();
    const category: Category = buildCategory();
    const filter: CategoryFilter = { ids: [categoryId('category-1')] };
    categoryService.findBy.mockResolvedValue([category]);

    const categories: Category[] = await adminCategoryService.findBy(filter);

    expect(categoryService.findBy).toHaveBeenCalledWith({
      ids: [categoryId('category-1')],
    });
    expect(categories).toHaveLength(1);
  });
});

describe('AdminCategoryService.findFullBy', () => {
  it('returns the mapped full category', async () => {
    const {
      adminCategoryService,
      categoryService,
    }: ReturnType<typeof buildAdminCategoryService> =
      buildAdminCategoryService();
    const category: Category = buildCategory();
    categoryService.findFullBy.mockResolvedValue([
      { ...category, guessObjects: [] },
    ]);

    const result: FullCategory = await adminCategoryService.findFullBy(
      categoryId('category-1'),
    );

    expect(result.guessObjects).toEqual([]);
  });

  it('rejects when the category does not exist', async () => {
    const {
      adminCategoryService,
      categoryService,
    }: ReturnType<typeof buildAdminCategoryService> =
      buildAdminCategoryService();
    categoryService.findFullBy.mockResolvedValue([]);

    await expect(
      adminCategoryService.findFullBy(categoryId('missing')),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATEGORY_NOT_FOUND },
    });
  });
});

describe('AdminCategoryService.create', () => {
  it('creates and maps a category', async () => {
    const {
      adminCategoryService,
      categoryService,
    }: ReturnType<typeof buildAdminCategoryService> =
      buildAdminCategoryService();
    const category: Category = buildCategory();
    categoryService.create.mockResolvedValue(category);
    const payload: CreateCategory = buildCreateCategory();

    const result: Category = await adminCategoryService.create(payload);

    expect(categoryService.create).toHaveBeenCalledWith(payload);
    expect(result.name).toBe('Monuments');
  });
});

describe('AdminCategoryService.update', () => {
  it('updates and maps a category', async () => {
    const {
      adminCategoryService,
      categoryService,
    }: ReturnType<typeof buildAdminCategoryService> =
      buildAdminCategoryService();
    const category: Category = buildCategory();
    categoryService.update.mockResolvedValue({
      ...category,
      name: 'Landmarks',
    });
    const payload: UpdateCategory = buildUpdateCategory({ name: 'Landmarks' });

    const result: Category = await adminCategoryService.update(
      categoryId('category-1'),
      payload,
    );

    expect(categoryService.update).toHaveBeenCalledWith(
      categoryId('category-1'),
      payload,
    );
    expect(result.name).toBe('Landmarks');
  });
});

describe('AdminCategoryService.delete', () => {
  it('delegates deletion', async () => {
    const {
      adminCategoryService,
      categoryService,
    }: ReturnType<typeof buildAdminCategoryService> =
      buildAdminCategoryService();
    categoryService.delete.mockResolvedValue(undefined);

    await adminCategoryService.delete(categoryId('category-1'));

    expect(categoryService.delete).toHaveBeenCalledWith(
      categoryId('category-1'),
    );
  });
});

describe('AdminCategoryService.getTrees', () => {
  it('returns mapped root trees', async () => {
    const {
      adminCategoryService,
      categoryService,
    }: ReturnType<typeof buildAdminCategoryService> =
      buildAdminCategoryService();
    const category: Category = buildCategory();
    const root: CategoryTree = {
      ...category,
      children: [],
    };
    categoryService.findTree.mockResolvedValue([root]);

    const trees: CategoryTree[] = await adminCategoryService.getTrees();

    expect(categoryService.findTree).toHaveBeenCalledWith({});
    expect(trees.map(({ id }) => id)).toEqual([root.id]);
  });
});
