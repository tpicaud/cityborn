import { contract } from '@cityborn/api';
import { initClient } from '@ts-rest/core';
import type { TokenStorage } from '../platform/tokenStorage';
import { AuthFetch, type AuthFetchOptions } from './authFetch';
import {
  type AuthTransport,
  createBearerAuthTransport,
  createCookieAuthTransport,
} from './authTransport';

function createClient(
  baseURL: string,
  authTransport: AuthTransport,
  options: AuthFetchOptions = {},
) {
  const authFetch: AuthFetch = new AuthFetch(baseURL, authTransport, options);
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
  return createClient(
    baseURL,
    createBearerAuthTransport(tokenStorage),
    options,
  );
}

export function createCookieApiClient(
  baseURL: string,
  options: AuthFetchOptions = {},
) {
  return createClient(baseURL, createCookieAuthTransport(), options);
}

export type ApiClient = ReturnType<typeof createApiClient>;
