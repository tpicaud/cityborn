import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import { ApiResponseError, ErrorCode } from '@cityborn/api';
import { QueryClient } from '@tanstack/react-query';
import type { HealthApi } from './healthApi';
import { serverReachabilityQueryOptions } from './healthQueries';

function fetchServerReachability({
  context,
  healthApi,
}: {
  context: TestContext;
  healthApi: HealthApi;
}): Promise<boolean> {
  const queryClient: QueryClient = new QueryClient();
  context.after(() => queryClient.clear());
  return queryClient.query({
    ...serverReachabilityQueryOptions(healthApi),
    retry: false,
  });
}

describe('serverReachabilityQueryOptions', () => {
  it('reports the server as reachable when the healthcheck succeeds', async (context: TestContext) => {
    const healthApi: HealthApi = { checkHealth: async () => undefined };

    const isReachable: boolean = await fetchServerReachability({
      context,
      healthApi,
    });

    assert.equal(isReachable, true);
  });

  it('reports the server as reachable when the healthcheck answers with an API error', async (context: TestContext) => {
    const healthApi: HealthApi = {
      checkHealth: async () => {
        throw new ApiResponseError({
          code: ErrorCode.UNKNOWN_ERROR,
          statusCode: 503,
          message: 'Database unavailable',
        });
      },
    };

    const isReachable: boolean = await fetchServerReachability({
      context,
      healthApi,
    });

    assert.equal(isReachable, true);
  });

  it('propagates the network failure of the healthcheck request', async (context: TestContext) => {
    const networkError: TypeError = new TypeError('Network request failed');
    const healthApi: HealthApi = {
      checkHealth: async () => {
        throw networkError;
      },
    };

    const serverReachability: Promise<boolean> = fetchServerReachability({
      context,
      healthApi,
    });

    await assert.rejects(serverReachability, networkError);
  });
});
