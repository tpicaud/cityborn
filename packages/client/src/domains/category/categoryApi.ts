import type {
  AppContract,
  Category,
  CategoryId,
  CategoryTree,
  CreateCategory,
  FullCategory,
  UpdateCategory,
} from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import type { ClientInferResponses } from '@ts-rest/core';
import type { ContractClient } from '../../api/contractClient';

type CategoryContractClient = Pick<ContractClient, 'category'> & {
  admin: Pick<ContractClient['admin'], 'category'>;
};

type CategoryUpdate = {
  categoryId: CategoryId;
  category: UpdateCategory;
};

export interface CategoryApi {
  getCategoryTrees(): Promise<CategoryTree[]>;
  getCategories(): Promise<Category[]>;
  getFullCategory(categoryId: CategoryId): Promise<FullCategory | null>;
  createCategory(category: CreateCategory): Promise<Category>;
  updateCategory(categoryUpdate: CategoryUpdate): Promise<Category>;
  deleteCategory(categoryId: CategoryId): Promise<void>;
}

export function createCategoryApi(
  contractClient: CategoryContractClient,
): CategoryApi {
  return {
    async getCategoryTrees() {
      return unwrapApiResponse(
        await contractClient.category.getCategoryTrees({}),
      );
    },

    async getCategories() {
      return unwrapApiResponse(
        await contractClient.admin.category.getAllCategories({
          query: { include: 'guessObjects' },
        }),
      );
    },

    async getFullCategory(categoryId) {
      const result: ClientInferResponses<
        AppContract['admin']['category']['getFullCategory']
      > = await contractClient.admin.category.getFullCategory({
        params: { id: categoryId },
      });
      if (result.status === 404) return null;
      return unwrapApiResponse(result);
    },

    async createCategory(category) {
      return unwrapApiResponse(
        await contractClient.admin.category.createCategory({ body: category }),
      );
    },

    async updateCategory({ categoryId, category }) {
      return unwrapApiResponse(
        await contractClient.admin.category.updateCategory({
          params: { id: categoryId },
          body: category,
        }),
      );
    },

    async deleteCategory(categoryId) {
      unwrapApiResponse(
        await contractClient.admin.category.deleteCategory({
          params: { id: categoryId },
          body: {},
        }),
      );
    },
  };
}
