import {
  buildCreateCategory,
  buildUpdateCategory,
  ErrorCode,
} from '@cityborn/api';
import type { Category as PrismaCategory } from '@prisma/client';
import { createMock } from '../../../test/support/createMock';
import { AdminCategoryService } from './category.admin.service';
import type { CategoryService, PrismaCategoryNode } from './category.service';

const prismaCategory = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Monuments',
  isPublished: true,
  description: null,
  parentId: null,
} satisfies PrismaCategory;

function buildAdminCategoryService() {
  const categoryService = createMock<CategoryService>();
  const adminCategoryService = new AdminCategoryService(categoryService);

  return { adminCategoryService, categoryService };
}

describe('AdminCategoryService.findAll', () => {
  it('returns every mapped category', async () => {
    const { adminCategoryService, categoryService } =
      buildAdminCategoryService();
    categoryService.findAll.mockResolvedValue([
      prismaCategory,
      { ...prismaCategory, id: 'category-2' },
    ]);

    const categories = await adminCategoryService.findAll();

    expect(categories.map(({ id }) => id)).toEqual([
      '00000000-0000-4000-8000-000000000010',
      'category-2',
    ]);
  });
});

describe('AdminCategoryService.findBy', () => {
  it('forwards the filter and returns mapped categories', async () => {
    const { adminCategoryService, categoryService } =
      buildAdminCategoryService();
    categoryService.findBy.mockResolvedValue([prismaCategory]);

    const categories = await adminCategoryService.findBy({
      ids: ['category-1'],
    });

    expect(categoryService.findBy).toHaveBeenCalledWith({
      ids: ['category-1'],
    });
    expect(categories).toHaveLength(1);
  });
});

describe('AdminCategoryService.findFullBy', () => {
  it('returns the mapped full category', async () => {
    const { adminCategoryService, categoryService } =
      buildAdminCategoryService();
    categoryService.findFullBy.mockResolvedValue([
      { ...prismaCategory, guessObjects: [] },
    ]);

    const category = await adminCategoryService.findFullBy('category-1');

    expect(category.guessObjects).toEqual([]);
  });

  it('rejects when the category does not exist', async () => {
    const { adminCategoryService, categoryService } =
      buildAdminCategoryService();
    categoryService.findFullBy.mockResolvedValue([]);

    await expect(
      adminCategoryService.findFullBy('missing'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.CATEGORY_NOT_FOUND },
    });
  });
});

describe('AdminCategoryService.create', () => {
  it('creates and maps a category', async () => {
    const { adminCategoryService, categoryService } =
      buildAdminCategoryService();
    categoryService.create.mockResolvedValue(prismaCategory);
    const payload = buildCreateCategory();

    const category = await adminCategoryService.create(payload);

    expect(categoryService.create).toHaveBeenCalledWith(payload);
    expect(category.name).toBe('Monuments');
  });
});

describe('AdminCategoryService.update', () => {
  it('updates and maps a category', async () => {
    const { adminCategoryService, categoryService } =
      buildAdminCategoryService();
    categoryService.update.mockResolvedValue({
      ...prismaCategory,
      name: 'Landmarks',
      guessObjects: [],
    });
    const payload = buildUpdateCategory({ name: 'Landmarks' });

    const category = await adminCategoryService.update('category-1', payload);

    expect(categoryService.update).toHaveBeenCalledWith('category-1', payload);
    expect(category.name).toBe('Landmarks');
  });
});

describe('AdminCategoryService.delete', () => {
  it('delegates deletion', async () => {
    const { adminCategoryService, categoryService } =
      buildAdminCategoryService();
    categoryService.delete.mockResolvedValue(undefined);

    await adminCategoryService.delete('category-1');

    expect(categoryService.delete).toHaveBeenCalledWith('category-1');
  });
});

describe('AdminCategoryService.getTrees', () => {
  it('returns mapped root trees', async () => {
    const { adminCategoryService, categoryService } =
      buildAdminCategoryService();
    const root: PrismaCategoryNode = {
      ...prismaCategory,
      children: [],
    };
    categoryService.findTree.mockResolvedValue([root]);

    const trees = await adminCategoryService.getTrees();

    expect(categoryService.findTree).toHaveBeenCalledWith({});
    expect(trees.map(({ id }) => id)).toEqual([root.id]);
  });
});
