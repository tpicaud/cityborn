import { type ApiResult, type CategoryTree, toApiResult } from '@cityborn/api';
import { apiClient } from './client';

export async function fetchCategoryTrees(): Promise<ApiResult<CategoryTree[]>> {
  return toApiResult(await apiClient.category.getCategoryTrees({}));
}
