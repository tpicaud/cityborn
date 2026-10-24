import type { Pack, UpdatePack } from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { PackApi } from '../../../domains/pack/packApi';
import { updateSavedPack } from '../../../domains/pack/packQueries';
import { invalidateThemes } from '../../../domains/theme/themeQueries';

export async function savePack({
  packApi,
  queryClient,
  pack,
  signal,
}: {
  packApi: PackApi;
  queryClient: QueryClient;
  pack: UpdatePack;
  signal?: AbortSignal;
}): Promise<Pack> {
  const savedPack: Pack = await packApi.updatePack({ packId: pack.id, pack });
  signal?.throwIfAborted();
  await updateSavedPack({ queryClient, pack: savedPack, signal });
  signal?.throwIfAborted();
  await invalidateThemes(queryClient);
  signal?.throwIfAborted();
  return savedPack;
}
