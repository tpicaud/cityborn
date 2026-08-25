import type { CategoryTree } from '@cityborn/api';
import { throwOnAppError } from '@cityborn/client';
import { getServerClient } from '@/lib/serverClient';

export async function getCategoryTrees(): Promise<CategoryTree[]> {
  const client = await getServerClient();
  const result = await client.category.getCategoryTrees({});
  throwOnAppError(result);
  return result.body;
}
