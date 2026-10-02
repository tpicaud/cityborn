import {
  type ContractClient,
  createBearerContractClient,
} from '@cityborn/client/api';
import { getBackOfficeServerConfig } from '@/config/server';

type AdminClient = ContractClient['admin'];

let adminClient: AdminClient | undefined;

export function getAdminClient(): AdminClient {
  if (adminClient) return adminClient;

  const backOfficeServerConfig = getBackOfficeServerConfig();
  const contractClient: ContractClient = createBearerContractClient(
    backOfficeServerConfig.backendUrl,
    {
      getAccessToken: async () => backOfficeServerConfig.adminDashboardToken,
      getRefreshToken: async () => null,
      setTokens: async () => {},
      clearTokens: async () => {},
    },
    { client: { name: 'back-office' } },
  );
  adminClient = contractClient.admin;
  return adminClient;
}
