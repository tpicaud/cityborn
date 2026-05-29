'use server';

import type { CreateCategory, UpdateCategory } from '@cityborn/api';
import { toActionResult } from '@cityborn/api';
import { adminClient } from '@/lib/adminApiClient';

export async function getAllCategories() {
  const result = await adminClient.category.listCategories({
    query: { include: 'guessObjects' },
  });
  return toActionResult(result);
}

export async function createCategory(data: CreateCategory) {
  const result = await adminClient.category.createCategory({ body: data });
  return toActionResult(result);
}

export async function saveCategory(id: string, updatedCategory: UpdateCategory) {
  const result = await adminClient.category.updateCategory({
    params: { id },
    body: updatedCategory,
  });
  return toActionResult(result);
}

export async function deleteCategory(id: string) {
  const result = await adminClient.category.deleteCategory({
    params: { id },
    body: {},
  });
  return toActionResult(result);
}
