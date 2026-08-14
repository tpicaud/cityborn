'use server';

import type {
  ApiResult,
  Category,
  CreateCategory,
  UpdateCategory,
} from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import { adminClient } from '@/lib/adminApiClient';

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

export async function deleteCategory(id: string): Promise<ApiResult<void>> {
  const result = await adminClient.category.deleteCategory({
    params: { id },
    body: {},
  });
  const r = toApiResult(result);
  if (!r.ok) return r;
  return { ok: true, data: undefined };
}
