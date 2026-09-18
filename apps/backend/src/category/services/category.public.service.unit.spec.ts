import { buildCategory, CategoryIdSchema } from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import { PublicCategoryService } from './category.public.service';
import type { CategoryService } from './category.service';

const categoryId = (value: string) => CategoryIdSchema.parse(value);

function buildPublicCategoryService() {
  const categoryService = createMock<CategoryService>();
  const publicCategoryService = new PublicCategoryService(categoryService);

  return { publicCategoryService, categoryService };
}

describe('PublicCategoryService.findAll', () => {
  it('loads only published categories', async () => {
    const { publicCategoryService, categoryService } =
      buildPublicCategoryService();
    const category = buildCategory();
    categoryService.findBy.mockResolvedValue([category]);

    const categories = await publicCategoryService.findAll();

    expect(categoryService.findBy).toHaveBeenCalledWith({ isPublished: true });
    expect(categories).toHaveLength(1);
  });
});

describe('PublicCategoryService.findBy', () => {
  it('enforces the published filter', async () => {
    const { publicCategoryService, categoryService } =
      buildPublicCategoryService();
    const category = buildCategory();
    const filter = { ids: [categoryId('category-1')] };
    categoryService.findBy.mockResolvedValue([category]);

    const categories = await publicCategoryService.findBy(filter);

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
    const category = buildCategory();
    const root = {
      ...category,
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
