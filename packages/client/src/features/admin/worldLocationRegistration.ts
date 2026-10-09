import type {
  CreateWorldLocation,
  WorldLocation,
  WorldLocationId,
} from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { AdminApi } from './api/adminApi';
import { invalidateSearches } from './api/adminQueries';

type WorldLocationRegistration = {
  adminApi: AdminApi;
  queryClient: QueryClient;
  worldLocation: CreateWorldLocation;
};

export async function registerWorldLocation({
  adminApi,
  queryClient,
  worldLocation,
}: WorldLocationRegistration): Promise<WorldLocation> {
  const worldLocationId: WorldLocationId =
    await adminApi.createWorldLocation(worldLocation);
  await invalidateSearches(queryClient);
  return { ...worldLocation, id: worldLocationId };
}
