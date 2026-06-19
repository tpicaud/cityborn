import { type ApiResult, type Category, toApiResult } from '@cityborn/api';
import { client } from './client';

export async function fetchCategories(): Promise<ApiResult<Category[]>> {
  const result = await client.category.getCategories({ query: {} });
  return toApiResult(result);
}
