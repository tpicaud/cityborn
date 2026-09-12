import {
  type ApiResult,
  type Category,
  type CategoryTree,
  toApiResult,
} from '@cityborn/api';
import { client } from './client';

export async function fetchCategories(): Promise<ApiResult<Category[]>> {
  const result = await client.category.getCategories({ query: {} });
  return toApiResult(result);
}

export async function fetchCategoryTrees(): Promise<ApiResult<CategoryTree[]>> {
  const result = await client.category.getCategoryTrees({});
  return toApiResult(result);
}
