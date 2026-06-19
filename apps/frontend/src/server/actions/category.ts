'use server';

import type { Category } from '@cityborn/api';
import { type ApiResult, toApiResult } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function fetchCategories(): Promise<ApiResult<Category[]>> {
  const client = await getServerClient();
  const result = await client.category.getCategories({ query: {} });
  return toApiResult(result);
}
