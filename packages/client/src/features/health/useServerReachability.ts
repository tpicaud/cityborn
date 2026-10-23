'use client';

import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { invalidateCurrentUser } from '../../domains/auth/authQueries';
import type { HealthApi } from '../../domains/health/healthApi';
import { serverReachabilityQueryOptions } from '../../domains/health/healthQueries';

export type ServerReachability = {
  isServerUnreachable: boolean;
  recheckServerReachability: () => Promise<void>;
};

export async function recheckServerReachability({
  queryClient,
  healthApi,
}: {
  queryClient: QueryClient;
  healthApi: HealthApi;
}): Promise<void> {
  const isServerReachable: boolean = await queryClient
    .query({ ...serverReachabilityQueryOptions(healthApi), staleTime: 0 })
    .catch((): boolean => false);
  if (isServerReachable) {
    await invalidateCurrentUser(queryClient);
  }
}

export function useServerReachability(): ServerReachability {
  const { healthApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const serverReachabilityQuery: UseQueryResult<boolean> = useQuery(
    serverReachabilityQueryOptions(healthApi),
  );

  return {
    isServerUnreachable: serverReachabilityQuery.isError,
    recheckServerReachability: () =>
      recheckServerReachability({ queryClient, healthApi }),
  };
}
