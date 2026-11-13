import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import { buildUser } from '@cityborn/api';
import { QueryClient } from '@tanstack/react-query';
import { setCurrentUser } from '../../domains/auth/authQueries';
import type { HealthApi } from '../../domains/health/healthApi';
import { recheckServerReachability } from './useServerReachability';

async function createSignedInQueryClient(
  context: TestContext,
): Promise<QueryClient> {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0 } },
  });
  context.after(() => queryClient.clear());
  await setCurrentUser({ queryClient, user: buildUser() });
  return queryClient;
}

function isCurrentUserInvalidated(queryClient: QueryClient): boolean {
  return queryClient.getQueryState(['currentUser'])?.isInvalidated === true;
}

describe('recheckServerReachability', () => {
  it('reloads the current user when the server answers again', async (context: TestContext) => {
    const queryClient: QueryClient = await createSignedInQueryClient(context);
    const healthApi: HealthApi = { checkHealth: async () => undefined };

    await recheckServerReachability({ queryClient, healthApi });

    assert.equal(isCurrentUserInvalidated(queryClient), true);
  });

  it('keeps the current user when the server is still unreachable', async (context: TestContext) => {
    const queryClient: QueryClient = await createSignedInQueryClient(context);
    const healthApi: HealthApi = {
      checkHealth: async () => {
        throw new TypeError('Network request failed');
      },
    };

    await recheckServerReachability({ queryClient, healthApi });

    assert.equal(isCurrentUserInvalidated(queryClient), false);
  });
});
