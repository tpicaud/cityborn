import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CategoryTree } from '@cityborn/api';
import {
  categoryTreeToCategory,
  flattenCategoryTree,
  ROOT_CATEGORY_LABEL,
  resolveCategoryPathLabel,
  resolveVisibleCategoryNodes,
} from './category-tree';

function node(
  id: string,
  children: CategoryTree[] = [],
  parentId?: string,
): CategoryTree {
  return {
    id,
    name: `pack-${id}`,
    isPublished: true,
    description: undefined,
    parentId,
    children,
  };
}

const leaf = node('child', [], 'root');
const root = node('root', [leaf]);

describe('flattenCategoryTree', () => {
  it('flattens parents before their children', () => {
    assert.deepEqual(
      flattenCategoryTree([root]).map((category) => category.id),
      ['root', 'child'],
    );
  });

  it('drops the children field from each node', () => {
    assert.deepEqual(categoryTreeToCategory(root), {
      id: 'root',
      name: 'pack-root',
      isPublished: true,
      description: undefined,
      parentId: undefined,
    });
  });
});

describe('resolveVisibleCategoryNodes', () => {
  it('shows the roots when no pack is open', () => {
    assert.deepEqual(resolveVisibleCategoryNodes([root], []), [root]);
  });

  it('shows the children of the deepest open pack', () => {
    assert.deepEqual(resolveVisibleCategoryNodes([root], [root]), [leaf]);
  });
});

describe('resolveCategoryPathLabel', () => {
  it('labels the root level', () => {
    assert.equal(resolveCategoryPathLabel([]), ROOT_CATEGORY_LABEL);
  });

  it('labels the deepest open pack', () => {
    assert.equal(resolveCategoryPathLabel([root, leaf]), 'pack-child');
  });
});
