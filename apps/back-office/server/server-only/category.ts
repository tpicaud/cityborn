import type { Category, FullCategory } from '@cityborn/api';
import { throwOnAppError } from '@cityborn/client';
import { adminClient } from '@/lib/adminApiClient';

export async function getCategories(): Promise<Category[]> {
  const result = await adminClient.category.getAllCategories({
    query: { include: 'guessObjects' },
  });
  throwOnAppError(result);
  return result.body;
}

export async function getFullCategory(
  id: string,
): Promise<FullCategory | null> {
  const result = await adminClient.category.getFullCategory({
    params: { id },
  });
  if (result.status === 404) return null;
  throwOnAppError(result);
  return result.body;
}
