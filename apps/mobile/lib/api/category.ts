import {
  type ApiResult,
  type Category,
  type CategoryTree,
  toApiResult,
} from '@cityborn/api';
import { contractClient } from './contractClient';

export async function fetchCategories(): Promise<ApiResult<Category[]>> {
  const result = await contractClient.category.getCategories({ query: {} });
  return toApiResult(result);
}

export async function fetchCategoryTrees(): Promise<ApiResult<CategoryTree[]>> {
  const result = await contractClient.category.getCategoryTrees({});
  return toApiResult(result);
}
