import { ApiResponseError } from '@cityborn/api';
import { queryOptions } from '@tanstack/react-query';
import type { HealthApi } from './healthApi';

async function checkServerReachability(healthApi: HealthApi): Promise<boolean> {
  try {
    await healthApi.checkHealth();
  } catch (error: unknown) {
    if (!(error instanceof ApiResponseError)) throw error;
  }
  return true;
}

export function serverReachabilityQueryOptions(healthApi: HealthApi) {
  return queryOptions({
    queryKey: ['health', 'serverReachability'],
    queryFn: () => checkServerReachability(healthApi),
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
    meta: { reportsError: false },
  });
}
