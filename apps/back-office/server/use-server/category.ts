'use server';

import type { Category, CreateCategory, UpdateCategory } from '@cityborn/api';
import { type AppResult, toAppResult } from '@cityborn/client';
import { adminClient } from '@/lib/adminApiClient';

export async function createCategory(
  data: CreateCategory,
): Promise<AppResult<Category>> {
  const result = await adminClient.category.createCategory({ body: data });
  return toAppResult(result);
}

export async function saveCategory(
  id: string,
  updatedCategory: UpdateCategory,
): Promise<AppResult<Category>> {
  const result = await adminClient.category.updateCategory({
    params: { id },
    body: updatedCategory,
  });
  return toAppResult(result);
}

export async function deleteCategory(id: string): Promise<AppResult<void>> {
  const result = await adminClient.category.deleteCategory({
    params: { id },
    body: {},
  });
  const r = toAppResult(result);
  if (!r.ok) return r;
  return { ok: true, data: undefined };
}
