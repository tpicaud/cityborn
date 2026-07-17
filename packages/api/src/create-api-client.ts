import { initClient } from '@ts-rest/core';
import { AuthFetch } from './auth-fetch';
import { contract } from './contract/contract';
import type { TokenStorage } from './types/token-storage';

export function createApiClient(baseURL: string, tokenStorage: TokenStorage) {
  const authFetch = new AuthFetch(baseURL, tokenStorage);
  return initClient(contract, {
    baseUrl: baseURL,
    baseHeaders: {},
    api: authFetch.buildApiFunction(),
    validateResponse: true,
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;
