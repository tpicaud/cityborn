import { createApiClient } from '@cityborn/api';

const adminToken = process.env.ADMIN_DASHBOARD_TOKEN ?? '';

const client = createApiClient(process.env.BACKEND_URL!, {
  getAccessToken: async () => adminToken,
  getRefreshToken: async () => null,
  setTokens: async () => {},
  clearTokens: async () => {},
});

export const adminClient = client.admin;
