import type { Category as PrismaCategory } from '@prisma/client';
import { createMock } from '../../../test/support/createMock';
import { PublicCategoryService } from './category.public.service';
import type { CategoryService, PrismaCategoryNode } from './category.service';

const prismaCategory = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Monuments',
  isPublished: true,
  description: null,
  parentId: null,
} satisfies PrismaCategory;

function buildPublicCategoryService() {
  const categoryService = createMock<CategoryService>();
  const publicCategoryService = new PublicCategoryService(categoryService);

  return { publicCategoryService, categoryService };
}

describe('PublicCategoryService.findAll', () => {
  it('loads only published categories', async () => {
    const { publicCategoryService, categoryService } =
      buildPublicCategoryService();
    categoryService.findBy.mockResolvedValue([prismaCategory]);

    const categories = await publicCategoryService.findAll();

    expect(categoryService.findBy).toHaveBeenCalledWith({ isPublished: true });
    expect(categories).toHaveLength(1);
  });
});

describe('PublicCategoryService.findBy', () => {
  it('enforces the published filter', async () => {
    const { publicCategoryService, categoryService } =
      buildPublicCategoryService();
    categoryService.findBy.mockResolvedValue([prismaCategory]);

    const categories = await publicCategoryService.findBy({
      ids: ['category-1'],
    });

    expect(categoryService.findBy).toHaveBeenCalledWith({
      ids: ['category-1'],
      isPublished: true,
    });
    expect(categories[0]?.isPublished).toBe(true);
  });
});

describe('PublicCategoryService.getTrees', () => {
  it('loads only published root trees', async () => {
    const { publicCategoryService, categoryService } =
      buildPublicCategoryService();
    const root: PrismaCategoryNode = {
      ...prismaCategory,
      children: [],
    };
    categoryService.findTree.mockResolvedValue([root]);

    const trees = await publicCategoryService.getTrees();

    expect(categoryService.findTree).toHaveBeenCalledWith({
      isPublished: true,
    });
    expect(trees.map(({ id }) => id)).toEqual([root.id]);
  });
});
