import { type ApiResult, type CategoryTree, toApiResult } from '@cityborn/api';
import { client } from './client';

export async function fetchCategoryTrees(): Promise<ApiResult<CategoryTree[]>> {
  const result = await client.category.getCategoryTrees({});
  return toApiResult(result);
}
