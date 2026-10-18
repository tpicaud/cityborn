'use client';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { serverReachabilityQueryOptions } from '../../domains/health/healthQueries';

export type ServerReachability = {
  isServerUnreachable: boolean;
  recheckServerReachability: () => Promise<void>;
};

export function useServerReachability(): ServerReachability {
  const { healthApi }: DomainApis = useDomainApis();
  const serverReachabilityQuery: UseQueryResult<boolean> = useQuery(
    serverReachabilityQueryOptions(healthApi),
  );

  return {
    isServerUnreachable: serverReachabilityQuery.isError,
    recheckServerReachability: async () => {
      await serverReachabilityQuery.refetch();
    },
  };
}
