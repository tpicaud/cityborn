import { createApiClient } from '@cityborn/client/api';
import { getBackOfficeServerConfig } from '@/config/server';

type AdminClient = ReturnType<typeof createApiClient>['admin'];

let adminClient: AdminClient | undefined;

export function getAdminClient(): AdminClient {
  if (adminClient) return adminClient;

  const backOfficeServerConfig = getBackOfficeServerConfig();
  const client = createApiClient(
    backOfficeServerConfig.backendUrl,
    {
      getAccessToken: async () => backOfficeServerConfig.adminDashboardToken,
      getRefreshToken: async () => null,
      setTokens: async () => {},
      clearTokens: async () => {},
    },
    { client: { name: 'back-office' } },
  );
  adminClient = client.admin;
  return adminClient;
}
