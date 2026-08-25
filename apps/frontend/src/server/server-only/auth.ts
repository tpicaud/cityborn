import type { User } from '@cityborn/api';
import { cookies } from 'next/headers';
import { getServerClient } from '@/lib/serverClient';

export async function hasToken(): Promise<boolean> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('access_token') ?? cookieStore.get('refresh_token');
  return !!token;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    if (!(await hasToken())) return null;
    const client = await getServerClient();
    const result = await client.auth.me();
    return result.status === 200 ? result.body : null;
  } catch {
    return null;
  }
}
