import type { Category } from '@cityborn/api';
import { throwOnError } from '@cityborn/api';
import { client } from './client';

export async function fetchCategories(): Promise<Category[]> {
  const result = await client.category.getCategories({ query: {} });
  throwOnError(result);
  return result.body;
}
