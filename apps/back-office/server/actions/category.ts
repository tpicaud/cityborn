'use server';

import type {
  ApiResult,
  Category,
  CreateCategory,
  UpdateCategory,
} from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import { adminClient } from '@/lib/adminApiClient';

export async function getAllCategories(): Promise<ApiResult<Category[]>> {
  const result = await adminClient.category.listCategories({
    query: { include: 'guessObjects' },
  });
  return toApiResult(result);
}

export async function createCategory(
  data: CreateCategory,
): Promise<ApiResult<Category>> {
  const result = await adminClient.category.createCategory({ body: data });
  return toApiResult(result);
}

export async function saveCategory(
  id: string,
  updatedCategory: UpdateCategory,
): Promise<ApiResult<Category>> {
  const result = await adminClient.category.updateCategory({
    params: { id },
    body: updatedCategory,
  });
  return toApiResult(result);
}

export async function deleteCategory(id: string): Promise<ApiResult<{}>> {
  const result = await adminClient.category.deleteCategory({
    params: { id },
    body: {},
  });
  return toApiResult(result);
}
