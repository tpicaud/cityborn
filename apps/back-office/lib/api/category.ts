import {
  type Category,
  type CategoryId,
  type CreateCategory,
  type FullCategory,
  type UpdateCategory,
  unwrapApiResponse,
} from '@cityborn/api';
import { contractClient } from './contract-client';

type UpdateCategoryRequest = {
  id: CategoryId;
  category: UpdateCategory;
};

export async function getCategories(): Promise<Category[]> {
  return unwrapApiResponse(
    await contractClient.admin.category.getAllCategories({
      query: { include: 'guessObjects' },
    }),
  );
}

export async function getFullCategory(
  id: CategoryId,
): Promise<FullCategory | null> {
  const result = await contractClient.admin.category.getFullCategory({
    params: { id },
  });
  if (result.status === 404) return null;
  return unwrapApiResponse(result);
}

export async function createCategory(
  category: CreateCategory,
): Promise<Category> {
  return unwrapApiResponse(
    await contractClient.admin.category.createCategory({ body: category }),
  );
}

export async function saveCategory({
  id,
  category,
}: UpdateCategoryRequest): Promise<Category> {
  return unwrapApiResponse(
    await contractClient.admin.category.updateCategory({
      params: { id },
      body: category,
    }),
  );
}

export async function deleteCategory(id: CategoryId): Promise<void> {
  unwrapApiResponse(
    await contractClient.admin.category.deleteCategory({
      params: { id },
      body: {},
    }),
  );
}
