import type { CategoryTree } from '@cityborn/api';
import { throwOnError } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function getCategoryTrees(): Promise<CategoryTree[]> {
  const client = await getServerClient();
  const result = await client.category.getCategoryTrees({});
  throwOnError(result);
  return result.body;
}
