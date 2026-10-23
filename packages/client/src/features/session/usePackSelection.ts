'use client';

import type { GameConfigChanges, Pack, PackTree, Session } from '@cityborn/api';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { packTreesQueryOptions } from '../../domains/pack/packQueries';

const noPackTrees: PackTree[] = [];

function toPack(node: PackTree): Pack {
  return {
    id: node.id,
    name: node.name,
    isPublished: node.isPublished,
    description: node.description,
    parentId: node.parentId,
  };
}

function flattenPackTree(nodes: PackTree[]): Pack[] {
  return nodes.flatMap((node) => [
    toPack(node),
    ...flattenPackTree(node.children),
  ]);
}

export type PackSelectionOptions = {
  session: Session;
  isHost: boolean;
  updateGameConfig: (changes: GameConfigChanges) => Promise<void>;
  startGame: () => Promise<void>;
};

export type PackSelection = {
  isLoading: boolean;
  selectedPath: PackTree[];
  currentNodes: PackTree[];
  currentName: string | undefined;
  openPack: (node: PackTree) => void;
  goBack: () => void;
  playPack: (node: PackTree) => Promise<void>;
};

export function usePackSelection({
  session,
  isHost,
  updateGameConfig,
  startGame,
}: PackSelectionOptions): PackSelection {
  const { packApi }: DomainApis = useDomainApis();
  const {
    data: packTrees = noPackTrees,
    isPending: isLoading,
  }: UseQueryResult<PackTree[]> = useQuery(packTreesQueryOptions(packApi));
  const [selectedPath, setSelectedPath] = useState<PackTree[]>([]);

  const allPacks = useMemo(() => flattenPackTree(packTrees), [packTrees]);

  const hasPacks = session.gameConfig.packs.length > 0;

  useEffect(() => {
    if (!isHost || hasPacks || allPacks.length === 0) return;
    updateGameConfig({ packs: allPacks });
  }, [isHost, hasPacks, allPacks, updateGameConfig]);

  const currentNodes =
    selectedPath.length === 0
      ? packTrees
      : selectedPath[selectedPath.length - 1].children;

  const playPack = async (node: PackTree) => {
    await updateGameConfig({ packs: [toPack(node)] });
    await startGame();
  };

  return {
    isLoading,
    selectedPath,
    currentNodes,
    currentName: selectedPath[selectedPath.length - 1]?.name,
    openPack: (node) => setSelectedPath((path) => [...path, node]),
    goBack: () => setSelectedPath((path) => path.slice(0, -1)),
    playPack,
  };
}
