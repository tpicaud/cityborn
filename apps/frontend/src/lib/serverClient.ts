import { createApiClient } from '@cityborn/api';
import { cookies } from 'next/headers';
import { WebTokenStorage } from './tokenStorage';

export async function getServerClient() {
  const tokenStorage = new WebTokenStorage(await cookies());
  return createApiClient(process.env.REST_BACKEND_URL!, tokenStorage);
}
