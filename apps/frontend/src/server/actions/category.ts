'use server';

import type { Category } from '@cityborn/api';
import { throwOnError } from '@/lib/actionUtils';
import { getServerClient } from '@/lib/serverClient';

export async function fetchCategories(): Promise<Category[]> {
  const client = await getServerClient();
  const result = await client.category.getCategories({ query: {} });
  throwOnError(result);
  return result.body;
}
