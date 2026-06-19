import type { Category } from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function getCategories(): Promise<Category[]> {
  const client = await getServerClient();
  const result = await client.category.getCategories({ query: {} });
  const action = toApiResult(result);
  if (!action.ok) throw new Error(action.error.message);
  return action.data;
}
