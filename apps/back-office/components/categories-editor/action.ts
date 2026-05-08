'use server';

import type { CreateCategory } from '@cityborn/api';
import { adminClient, throwOnError } from '@/lib/adminApiClient';

export async function getAllCategories() {
  const result = await adminClient.category.listCategories({ query: { include: 'guessObjects' } });
  throwOnError(result);
  if (result.status === 200) return result.body;
  throw new Error('Failed to get all categories');
}

export async function createCategory(createCategory: CreateCategory) {
  const result = await adminClient.category.createCategory({ body: createCategory });
  throwOnError(result);
  if (result.status === 201) return result.body;
  throw new Error('Failed to create category');
}
