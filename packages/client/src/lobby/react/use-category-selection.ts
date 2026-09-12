'use client';

import type { CategoryTree, GameConfig } from '@cityborn/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  categoryTreeToCategory,
  flattenCategoryTree,
  resolveCategoryPathLabel,
  resolveVisibleCategoryNodes,
} from '../category-tree';

export interface CategorySelection {
  visibleNodes: CategoryTree[];
  pathLabel: string;
  canGoBack: boolean;
  goBack: () => void;
  openNode: (node: CategoryTree) => void;
  playNode: (node: CategoryTree) => Promise<void>;
}

export interface CategorySelectionOptions {
  categoryTrees: CategoryTree[];
  selectedCategoriesCount: number;
  canConfigure: boolean;
  updateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  startGame: () => Promise<void>;
}

export function useCategorySelection({
  categoryTrees,
  selectedCategoriesCount,
  canConfigure,
  updateGameConfig,
  startGame,
}: CategorySelectionOptions): CategorySelection {
  const [selectedPath, setSelectedPath] = useState<CategoryTree[]>([]);
  const flatCategories = useMemo(
    () => flattenCategoryTree(categoryTrees),
    [categoryTrees],
  );

  useEffect(() => {
    if (!canConfigure) return;
    if (flatCategories.length === 0 || selectedCategoriesCount > 0) return;
    updateGameConfig({ categories: flatCategories });
  }, [flatCategories, selectedCategoriesCount, canConfigure, updateGameConfig]);

  const goBack = useCallback(
    () => setSelectedPath((path) => path.slice(0, -1)),
    [],
  );

  const openNode = useCallback(
    (node: CategoryTree) => setSelectedPath((path) => [...path, node]),
    [],
  );

  const playNode = useCallback(
    async (node: CategoryTree) => {
      await updateGameConfig({ categories: [categoryTreeToCategory(node)] });
      await startGame();
    },
    [updateGameConfig, startGame],
  );

  return {
    visibleNodes: resolveVisibleCategoryNodes(categoryTrees, selectedPath),
    pathLabel: resolveCategoryPathLabel(selectedPath),
    canGoBack: selectedPath.length > 0,
    goBack,
    openNode,
    playNode,
  };
}
