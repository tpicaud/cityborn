import type {
  CreateWorldLocation,
  WorldLocation,
  WorldLocationId,
} from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import { invalidateSearches } from '../../domains/search/searchQueries';
import type { WorldLocationApi } from '../../domains/world-location/worldLocationApi';

type WorldLocationRegistration = {
  worldLocationApi: WorldLocationApi;
  queryClient: QueryClient;
  worldLocation: CreateWorldLocation;
};

export async function registerWorldLocation({
  worldLocationApi,
  queryClient,
  worldLocation,
}: WorldLocationRegistration): Promise<WorldLocation> {
  const worldLocationId: WorldLocationId =
    await worldLocationApi.createWorldLocation(worldLocation);
  await invalidateSearches(queryClient);
  return { ...worldLocation, id: worldLocationId };
}
