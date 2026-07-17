import type { Category, CategoryTree } from '@cityborn/api';
import { throwOnError } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function getCategories(): Promise<Category[]> {
  const client = await getServerClient();
  const result = await client.category.getCategories({ query: {} });
  throwOnError(result);
  return result.body;
}

export async function getCategoryTrees(): Promise<CategoryTree[]> {
  const client = await getServerClient();
  const result = await client.category.getCategoryTrees({});
  throwOnError(result);
  return result.body;
}
