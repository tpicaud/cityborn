import { initClient } from '@ts-rest/core';
import { AuthFetch, type AuthFetchOptions } from './auth-fetch';
import { contract } from './contract/contract';
import type { TokenStorage } from './types/token-storage';

export function createApiClient(
  baseURL: string,
  tokenStorage: TokenStorage,
  options: AuthFetchOptions = {},
) {
  const authFetch = new AuthFetch(baseURL, tokenStorage, options);
  return initClient(contract, {
    baseUrl: baseURL,
    baseHeaders: {},
    api: authFetch.buildApiFunction(),
    validateResponse: true,
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;
