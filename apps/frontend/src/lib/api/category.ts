import { type ApiResult, type CategoryTree, toApiResult } from '@cityborn/api';
import { contractClient } from './contractClient';

export async function fetchCategoryTrees(): Promise<ApiResult<CategoryTree[]>> {
  return toApiResult(await contractClient.category.getCategoryTrees({}));
}
