import { createApiClient } from '@cityborn/client/api';
import { type AuthApi, createAuthApi } from '@cityborn/client/auth';
import { cookies, headers } from 'next/headers';
import { getFrontendServerConfig } from '@/config/server';
import { WebTokenStorage } from './tokenStorage';

async function createServerContext() {
  const frontendServerConfig = getFrontendServerConfig();
  const requestHeaders = await headers();
  const forwardedFor: string | undefined = requestHeaders
    .get('x-forwarded-for')
    ?.split(',')
    .at(-1)
    ?.trim();
  const tokenStorage = new WebTokenStorage(await cookies());
  const client = createApiClient(
    frontendServerConfig.restBackendUrl,
    tokenStorage,
    {
      client: { name: 'web' },
      forwardedFor,
    },
  );

  return { client, tokenStorage };
}

export async function getServerClient() {
  const { client } = await createServerContext();
  return client;
}

export async function getServerAuthApi(): Promise<AuthApi> {
  const { client, tokenStorage } = await createServerContext();
  return createAuthApi(client, tokenStorage);
}
