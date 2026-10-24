import type { FullPack, Pack, PackId } from '@cityborn/api';
import {
  type QueryClient,
  type QueryKey,
  queryOptions,
} from '@tanstack/react-query';
import type { PackApi } from './packApi';

type FullPackQuery = {
  packApi: PackApi;
  packId: PackId;
};

type PackDeletion = {
  queryClient: QueryClient;
  packId: PackId;
};

const packTreesCacheDurationMs: number = 60 * 60 * 1000;

const packsQueryKeyRoot: QueryKey = ['admin', 'packs'];

const packListQueryKey: QueryKey = [...packsQueryKeyRoot, 'list'];

function fullPackQueryKey(packId: PackId): QueryKey {
  return [...packsQueryKeyRoot, 'full', packId];
}

export function packTreesQueryOptions(packApi: PackApi) {
  return queryOptions({
    queryKey: ['pack', 'trees'],
    queryFn: () => packApi.getPackTrees(),
    staleTime: packTreesCacheDurationMs,
    gcTime: packTreesCacheDurationMs,
    retry: false,
    meta: { reportsError: true },
  });
}

export function packsQueryOptions(packApi: PackApi) {
  return queryOptions({
    queryKey: packListQueryKey,
    queryFn: () => packApi.getPacks(),
    staleTime: 0,
    retry: false,
    meta: { reportsError: true },
  });
}

export function fullPackQueryOptions({ packApi, packId }: FullPackQuery) {
  return queryOptions({
    queryKey: fullPackQueryKey(packId),
    queryFn: () => packApi.getFullPack(packId),
    staleTime: 0,
    retry: false,
    meta: { reportsError: true },
  });
}

export function reloadPacks(queryClient: QueryClient): Promise<void> {
  return queryClient.resetQueries({
    queryKey: packListQueryKey,
    exact: true,
  });
}

export function invalidatePacks(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: packsQueryKeyRoot });
}

export function markPacksStale(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: packsQueryKeyRoot,
    refetchType: 'none',
  });
}

export async function updateSavedPack({
  queryClient,
  pack,
  signal,
}: {
  queryClient: QueryClient;
  pack: Pack;
  signal?: AbortSignal;
}): Promise<void> {
  signal?.throwIfAborted();
  await queryClient.cancelQueries({ queryKey: packsQueryKeyRoot });
  signal?.throwIfAborted();
  queryClient.setQueryData<Pack[]>(packListQueryKey, (packs) =>
    packs?.map((cachedPack: Pack) =>
      cachedPack.id === pack.id ? pack : cachedPack,
    ),
  );
  queryClient.setQueryData<FullPack | null>(
    fullPackQueryKey(pack.id),
    (cachedPack) => (cachedPack ? { ...cachedPack, ...pack } : cachedPack),
  );
  await markPacksStale(queryClient);
}

export function removeDeletedPack({
  queryClient,
  packId,
}: PackDeletion): Promise<void> {
  queryClient.setQueryData<Pack[]>(
    packListQueryKey,
    (packs: Pack[] | undefined) =>
      packs?.filter((pack: Pack) => pack.id !== packId),
  );
  return markPacksStale(queryClient);
}
