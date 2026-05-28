import type { Category } from '@cityborn/api';
import { assertOk, client } from './client';

export async function fetchCategories(): Promise<Category[]> {
  const result = await client.category.getCategories({ query: {} });
  assertOk(result);
  return result.body;
}
