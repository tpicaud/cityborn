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

export function flattenCategoryTree(nodes: CategoryTree[]): Category[] {
  return nodes.flatMap((node) => [
    {
      id: node.id,
      name: node.name,
      isPublished: node.isPublished,
      description: node.description,
      parentId: node.parentId,
    },
    ...flattenCategoryTree(node.children),
  ]);
}

export function categoryTreeToCategory(node: CategoryTree): Category {
  return {
    id: node.id,
    name: node.name,
    isPublished: node.isPublished,
    description: node.description,
    parentId: node.parentId,
  };
}
