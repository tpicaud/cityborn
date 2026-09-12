'use client';

import type {
  ApiResult,
  Category,
  CategoryTree,
  GameConfig,
  Session,
} from '@cityborn/api';
import { useEffect, useMemo, useState } from 'react';
import { useError } from '../../shared/errorContext';

export function toCategory(node: CategoryTree): Category {
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
    toCategory(node),
    ...flattenCategoryTree(node.children),
  ]);
}

/**
 * Chargement des packs côté client, pour les plateformes qui n'ont pas de
 * rendu serveur pour les précharger.
 */
export function useCategoryTrees(
  fetchCategoryTrees: () => Promise<ApiResult<CategoryTree[]>>,
): CategoryTree[] {
  const { invokeError } = useError();
  const [categoryTrees, setCategoryTrees] = useState<CategoryTree[]>([]);

  useEffect(() => {
    const loadCategoryTrees = async () => {
      const result = await fetchCategoryTrees();
      if (!result.ok) return invokeError(result.error);
      setCategoryTrees(result.data);
    };
    loadCategoryTrees();
  }, [fetchCategoryTrees, invokeError]);

  return categoryTrees;
}

export interface CategorySelectionOptions {
  categoryTrees: CategoryTree[];
  session: Session;
  isHost: boolean;
  updateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  startGame: () => Promise<void>;
}

export interface CategorySelection {
  selectedPath: CategoryTree[];
  currentNodes: CategoryTree[];
  currentName: string | undefined;
  openCategory: (node: CategoryTree) => void;
  goBack: () => void;
  playCategory: (node: CategoryTree) => Promise<void>;
}

/**
 * Navigation dans l'arbre de packs du lobby. Seul l'hôte pousse la
 * configuration : les autres joueurs se verraient refuser la commande.
 */
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
