import type { Pack, UpdatePack } from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { PackApi } from '../../../domains/pack/packApi';
import { updateSavedPack } from '../../../domains/pack/packQueries';
import { invalidateThemes } from '../../../domains/theme/themeQueries';

export async function savePack({
  packApi,
  queryClient,
  pack,
}: {
  packApi: PackApi;
  queryClient: QueryClient;
  pack: UpdatePack;
}): Promise<Pack> {
  const savedPack: Pack = await packApi.updatePack({ packId: pack.id, pack });
  await updateSavedPack({ queryClient, pack: savedPack });
  await invalidateThemes(queryClient);
  return savedPack;
}
