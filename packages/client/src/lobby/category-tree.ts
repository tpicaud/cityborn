import type { Category, CategoryTree } from '@cityborn/api';

export const ROOT_CATEGORY_LABEL = 'Packs';

export function categoryTreeToCategory(node: CategoryTree): Category {
  return {
    id: node.id,
    name: node.name,
    isPublished: node.isPublished,
    description: node.description,
    parentId: node.parentId,
  };
}

export function flattenCategoryTree(nodes: CategoryTree[]): Category[] {
  return nodes.flatMap((node) => [
    categoryTreeToCategory(node),
    ...flattenCategoryTree(node.children),
  ]);
}

export function resolveVisibleCategoryNodes(
  roots: CategoryTree[],
  selectedPath: CategoryTree[],
): CategoryTree[] {
  if (selectedPath.length === 0) return roots;
  return selectedPath[selectedPath.length - 1].children;
}

export function resolveCategoryPathLabel(selectedPath: CategoryTree[]): string {
  if (selectedPath.length === 0) return ROOT_CATEGORY_LABEL;
  return selectedPath[selectedPath.length - 1].name;
}
