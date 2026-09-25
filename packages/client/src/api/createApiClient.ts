import { contract } from '@cityborn/api';
import { initClient } from '@ts-rest/core';
import type { TokenStorage } from '../platform/tokenStorage';
import { AuthFetch, type AuthFetchOptions } from './authFetch';

function createClient(
  baseURL: string,
  tokenStorage: TokenStorage | null,
  options: AuthFetchOptions = {},
) {
  const authFetch: AuthFetch = new AuthFetch(baseURL, tokenStorage, options);
  return initClient(contract, {
    baseUrl: baseURL,
    baseHeaders: {},
    api: authFetch.buildApiFunction(),
    validateResponse: true,
  });
}

export function createApiClient(
  baseURL: string,
  tokenStorage: TokenStorage,
  options: AuthFetchOptions = {},
) {
  return createClient(baseURL, tokenStorage, options);
}

export function createCookieApiClient(
  baseURL: string,
  options: AuthFetchOptions = {},
) {
  return createClient(baseURL, null, options);
}

export type ApiClient = ReturnType<typeof createApiClient>;
