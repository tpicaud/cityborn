import { type ApiClient, createCookieApiClient } from '@cityborn/client/api';
import { frontendClientConfig } from '@/config/client';
import { getOrCreateVisitorId } from '@/lib/visitorId';

export const apiClient: ApiClient = createCookieApiClient(
  frontendClientConfig.restBackendUrl,
  {
    client: { name: 'web' },
    getVisitorId: getOrCreateVisitorId,
  },
);
