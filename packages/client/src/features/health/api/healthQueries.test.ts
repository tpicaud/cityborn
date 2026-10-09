import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiResponseError, ErrorCode } from '@cityborn/api';
import { QueryClient } from '@tanstack/react-query';
import type { HealthApi } from './healthApi';
import { serverReachabilityQueryOptions } from './healthQueries';

function fetchServerReachability(healthApi: HealthApi): Promise<boolean> {
  const queryClient: QueryClient = new QueryClient();
  return queryClient.fetchQuery({
    ...serverReachabilityQueryOptions(healthApi),
    retry: false,
  });
}

test('the server is reachable when the healthcheck succeeds', async () => {
  const healthApi: HealthApi = { checkHealth: async () => undefined };

  assert.equal(await fetchServerReachability(healthApi), true);
});

test('the server is reachable when the healthcheck answers with an API error', async () => {
  const healthApi: HealthApi = {
    checkHealth: async () => {
      throw new ApiResponseError({
        code: ErrorCode.UNKNOWN_ERROR,
        statusCode: 503,
        message: 'Database unavailable',
      });
    },
  };

  assert.equal(await fetchServerReachability(healthApi), true);
});

test('the server is unreachable when the healthcheck request fails', async () => {
  const networkError: TypeError = new TypeError('Network request failed');
  const healthApi: HealthApi = {
    checkHealth: async () => {
      throw networkError;
    },
  };

  await assert.rejects(fetchServerReachability(healthApi), networkError);
});
