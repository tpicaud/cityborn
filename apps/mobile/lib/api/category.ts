import type { Category, CategoryTree } from '@cityborn/api';
import { type AppResult, toAppResult } from '@cityborn/client';
import { client } from './client';

export async function fetchCategories(): Promise<AppResult<Category[]>> {
  const result = await client.category.getCategories({ query: {} });
  return toAppResult(result);
}

export async function fetchCategoryTrees(): Promise<AppResult<CategoryTree[]>> {
  const result = await client.category.getCategoryTrees({});
  return toAppResult(result);
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
