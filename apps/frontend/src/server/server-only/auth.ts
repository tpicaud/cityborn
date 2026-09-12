import type { User } from '@cityborn/api';
import { getServerAuthApi } from '@/lib/serverClient';

export async function getCurrentUser(): Promise<User | null> {
  const authApi = await getServerAuthApi();
  return authApi.getCurrentUser();
}
