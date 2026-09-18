import type { Category, CategoryId, CategoryTree } from '@cityborn/api';
import { buildCategory, CategoryIdSchema } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { CategoryFilter } from '../repositories/category.repository';
import { PublicCategoryService } from './category.public.service';
import type { CategoryService } from './category.service';

const categoryId: (value: string) => CategoryId = (value: string) =>
  CategoryIdSchema.parse(value);

function buildPublicCategoryService() {
  const categoryService: DeepMocked<CategoryService> =
    createMock<CategoryService>();
  const publicCategoryService: PublicCategoryService =
    new PublicCategoryService(categoryService);

  return { publicCategoryService, categoryService };
}

describe('PublicCategoryService.findAll', () => {
  it('loads only published categories', async () => {
    const {
      publicCategoryService,
      categoryService,
    }: ReturnType<typeof buildPublicCategoryService> =
      buildPublicCategoryService();
    const category: Category = buildCategory();
    categoryService.findBy.mockResolvedValue([category]);

    const categories: Category[] = await publicCategoryService.findAll();

    expect(categoryService.findBy).toHaveBeenCalledWith({ isPublished: true });
    expect(categories).toHaveLength(1);
  });
});

describe('PublicCategoryService.findBy', () => {
  it('enforces the published filter', async () => {
    const {
      publicCategoryService,
      categoryService,
    }: ReturnType<typeof buildPublicCategoryService> =
      buildPublicCategoryService();
    const category: Category = buildCategory();
    const filter: CategoryFilter = { ids: [categoryId('category-1')] };
    categoryService.findBy.mockResolvedValue([category]);

    const categories: Category[] = await publicCategoryService.findBy(filter);

    expect(categoryService.findBy).toHaveBeenCalledWith({
      ids: ['category-1'],
      isPublished: true,
    });
    expect(categories[0]?.isPublished).toBe(true);
  });
});

describe('PublicCategoryService.getTrees', () => {
  it('loads only published root trees', async () => {
    const {
      publicCategoryService,
      categoryService,
    }: ReturnType<typeof buildPublicCategoryService> =
      buildPublicCategoryService();
    const category: Category = buildCategory();
    const root: CategoryTree = {
      ...category,
      children: [],
    };
    categoryService.findTree.mockResolvedValue([root]);

    const trees: CategoryTree[] = await publicCategoryService.getTrees();

    expect(categoryService.findTree).toHaveBeenCalledWith({
      isPublished: true,
    });
    expect(trees.map(({ id }) => id)).toEqual([root.id]);
  });
});
