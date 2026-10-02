'use client';

import type {
  Category,
  CategoryTree,
  GameConfig,
  Session,
} from '@cityborn/api';
import { useEffect, useMemo, useState } from 'react';

function toCategory(node: CategoryTree): Category {
  return {
    id: node.id,
    name: node.name,
    isPublished: node.isPublished,
    description: node.description,
    parentId: node.parentId,
  };
}

function flattenCategoryTree(nodes: CategoryTree[]): Category[] {
  return nodes.flatMap((node) => [
    toCategory(node),
    ...flattenCategoryTree(node.children),
  ]);
}

export type CategorySelectionOptions = {
  categoryTrees: CategoryTree[];
  session: Session;
  isHost: boolean;
  updateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  startGame: () => Promise<void>;
};

export type CategorySelection = {
  selectedPath: CategoryTree[];
  currentNodes: CategoryTree[];
  currentName: string | undefined;
  openCategory: (node: CategoryTree) => void;
  goBack: () => void;
  playCategory: (node: CategoryTree) => Promise<void>;
};

export function useCategorySelection({
  categoryTrees,
  session,
  isHost,
  updateGameConfig,
  startGame,
}: CategorySelectionOptions): CategorySelection {
  const [selectedPath, setSelectedPath] = useState<CategoryTree[]>([]);

  const allCategories = useMemo(
    () => flattenCategoryTree(categoryTrees),
    [categoryTrees],
  );

  const hasCategories = session.gameConfig.categories.length > 0;

  useEffect(() => {
    if (!isHost || hasCategories || allCategories.length === 0) return;
    updateGameConfig({ categories: allCategories });
  }, [isHost, hasCategories, allCategories, updateGameConfig]);

  const currentNodes =
    selectedPath.length === 0
      ? categoryTrees
      : selectedPath[selectedPath.length - 1].children;

  const playCategory = async (node: CategoryTree) => {
    await updateGameConfig({ categories: [toCategory(node)] });
    await startGame();
  };

  return {
    selectedPath,
    currentNodes,
    currentName: selectedPath[selectedPath.length - 1]?.name,
    openCategory: (node) => setSelectedPath((path) => [...path, node]),
    goBack: () => setSelectedPath((path) => path.slice(0, -1)),
    playCategory,
  };
}
