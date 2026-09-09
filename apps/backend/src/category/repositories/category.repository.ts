import type {
  Category,
  CategoryId,
  CategoryTree,
  CreateCategory,
  FullCategory,
  GuessObjectId,
  UpdateCategory,
} from '@cityborn/api';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export type CategoryFilter = {
  ids?: CategoryId[];
  isPublished?: boolean;
};

export interface CategoryRepository {
  findTree(
    filter: Pick<CategoryFilter, 'isPublished'>,
  ): Promise<CategoryTree[]>;
  findBy(filter: CategoryFilter): Promise<Category[]>;
  findFullBy(filter: CategoryFilter): Promise<FullCategory[]>;
  create(data: CreateCategory): Promise<Category>;
  update(categoryId: CategoryId, data: UpdateCategory): Promise<Category>;
  countChildren(id: CategoryId): Promise<number>;
  countByGuessObjectId(id: GuessObjectId): Promise<number>;
  delete(id: CategoryId): Promise<void>;
}
