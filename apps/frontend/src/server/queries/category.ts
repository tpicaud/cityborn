import type { Category } from '@cityborn/api';
import { throwOnError } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function getCategories(): Promise<Category[]> {
  const client = await getServerClient();
  const result = await client.category.getCategories({ query: {} });
  throwOnError(result);
  return result.body;
}
