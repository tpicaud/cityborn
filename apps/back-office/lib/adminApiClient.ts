import { createApiClient } from '@cityborn/client';

const adminToken = process.env.ADMIN_DASHBOARD_TOKEN ?? '';

const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) {
  throw new Error('BACKEND_URL is not set');
}

const client = createApiClient(
  backendUrl,
  {
    getAccessToken: async () => adminToken,
    getRefreshToken: async () => null,
    setTokens: async () => {},
    clearTokens: async () => {},
  },
  { client: { name: 'back-office' } },
);

export const adminClient = client.admin;
