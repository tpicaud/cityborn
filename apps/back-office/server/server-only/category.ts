import { type Category, type FullCategory, throwOnError } from '@cityborn/api';
import { adminClient } from '@/lib/adminApiClient';

export async function getCategories(): Promise<Category[]> {
  const result = await adminClient.category.getAllCategories({
    query: { include: 'guessObjects' },
  });
  throwOnError(result);
  return result.body;
}

export async function getFullCategory(
  id: string,
): Promise<FullCategory | null> {
  const result = await adminClient.category.getFullCategory({
    params: { id },
  });
  if (result.status === 404) return null;
  throwOnError(result);
  return result.body;
}
