import type { CategoryTree } from '@cityborn/api';
import { unwrapApiResponse } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function getCategoryTrees(): Promise<CategoryTree[]> {
  const client = await getServerClient();
  const result = await client.category.getCategoryTrees({});
  return unwrapApiResponse(result);
}
