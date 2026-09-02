import { createApiClient } from '@cityborn/client';
import { cookies } from 'next/headers';
import { WebTokenStorage } from './tokenStorage';

export async function getServerClient() {
  const restBackendUrl = process.env.REST_BACKEND_URL;
  if (!restBackendUrl) {
    throw new Error('REST_BACKEND_URL is not set');
  }

  const tokenStorage = new WebTokenStorage(await cookies());
  return createApiClient(restBackendUrl, tokenStorage, {
    client: { name: 'web' },
  });
}
