'use server';

import type {
  ActionResult,
  Category,
  CreateCategory,
  UpdateCategory,
} from '@cityborn/api';
import { toActionResult } from '@cityborn/api';
import { adminClient } from '@/lib/adminApiClient';

export async function getAllCategories(): Promise<ActionResult<Category[]>> {
  const result = await adminClient.category.listCategories({
    query: { include: 'guessObjects' },
  });
  return toActionResult(result);
}

export async function createCategory(
  data: CreateCategory,
): Promise<ActionResult<Category>> {
  const result = await adminClient.category.createCategory({ body: data });
  return toActionResult(result);
}

export async function saveCategory(
  id: string,
  updatedCategory: UpdateCategory,
): Promise<ActionResult<Category>> {
  const result = await adminClient.category.updateCategory({
    params: { id },
    body: updatedCategory,
  });
  return toActionResult(result);
}

export async function deleteCategory(id: string): Promise<ActionResult<{}>> {
  const result = await adminClient.category.deleteCategory({
    params: { id },
    body: {},
  });
  return toActionResult(result);
}
