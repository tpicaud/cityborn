import { initClient } from '@ts-rest/core';
import { AuthFetch } from './auth-fetch.js';
import { contract } from './contract/contract.js';
import type { TokenStorage } from './types/token-storage.js';

export function createApiClient(baseURL: string, tokenStorage: TokenStorage) {
  const authFetch = new AuthFetch(baseURL, tokenStorage);
  return initClient(contract, {
    baseUrl: baseURL,
    baseHeaders: {},
    api: authFetch.buildApiFunction(),
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;
