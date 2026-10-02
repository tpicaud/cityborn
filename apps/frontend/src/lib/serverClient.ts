import {
  type ContractClient,
  createBearerContractClient,
} from '@cityborn/client/api';
import { type AuthApi, createAuthApi } from '@cityborn/client/auth';
import { cookies } from 'next/headers';
import { getFrontendServerConfig } from '@/config/server';
import { WebTokenStorage } from './tokenStorage';

async function createServerContext() {
  const frontendServerConfig = getFrontendServerConfig();
  const tokenStorage = new WebTokenStorage(await cookies());
  const contractClient: ContractClient = createBearerContractClient(
    frontendServerConfig.restBackendUrl,
    tokenStorage,
    {
      client: { name: 'web' },
    },
  );

  return { contractClient, tokenStorage };
}

export async function getServerClient(): Promise<ContractClient> {
  const { contractClient } = await createServerContext();
  return contractClient;
}

export async function getServerAuthApi(): Promise<AuthApi> {
  const { contractClient, tokenStorage } = await createServerContext();
  return createAuthApi(contractClient, tokenStorage);
}
