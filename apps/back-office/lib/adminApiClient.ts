import { createApiClient } from '@cityborn/api';

const adminToken = process.env.ADMIN_DASHBOARD_TOKEN ?? '';

const client = createApiClient(process.env.BACKEND_URL!, {
  getAccessToken: async () => adminToken,
  getRefreshToken: async () => null,
  setTokens: async () => {},
  clearTokens: async () => {},
});

export const adminClient = client.admin;

export function throwOnError(result: { status: number; body: unknown }): void {
  if (result.status < 200 || result.status >= 300) {
    const body = result.body as { message?: string } | null;
    throw new Error(body?.message ?? 'API error');
  }
}
