'use server';

import type { User } from '@cityborn/api';
import { ApiError, ErrorCode } from '@cityborn/errors';
import { cookies } from 'next/headers';
import {
  expireTokensInCookies,
  storeTokensInCookies,
} from '@/app/api/auth/utils';
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

export async function signUp(
  username: string,
  email: string,
  password: string,
): Promise<void> {
  const client = await getServerClient();
  const result = await client.auth.signUp({ body: { username, email, password } });
  if (result.status !== 201) {
    const body = result.body as { code?: string; message?: string; statusCode?: number };
    throw new ApiError(
      (body?.code ?? ErrorCode.UNKNOWN_ERROR) as ErrorCode,
      body?.message ?? 'Failed to sign up',
      body?.statusCode ?? result.status,
    );
  }
  await storeTokensInCookies(result.body.access_token, result.body.refresh_token);
}

export async function signIn(
  identifier: string,
  password: string,
): Promise<void> {
  const client = await getServerClient();
  const result = await client.auth.signIn({ body: { identifier, password } });
  if (result.status !== 200) {
    const body = result.body as { code?: string; message?: string; statusCode?: number };
    throw new ApiError(
      (body?.code ?? ErrorCode.UNKNOWN_ERROR) as ErrorCode,
      body?.message ?? 'Failed to sign in',
      body?.statusCode ?? result.status,
    );
  }
  await storeTokensInCookies(result.body.access_token, result.body.refresh_token);
}

export async function signInWithGoogle(idToken: string): Promise<void> {
  const client = await getServerClient();
  const result = await client.auth.signInWithGoogle({ body: { idToken } });
  if (result.status !== 200) {
    const body = result.body as { code?: string; message?: string; statusCode?: number };
    throw new ApiError(
      (body?.code ?? ErrorCode.UNKNOWN_ERROR) as ErrorCode,
      body?.message ?? 'Failed to sign in with Google',
      body?.statusCode ?? result.status,
    );
  }
  await storeTokensInCookies(result.body.access_token, result.body.refresh_token);
}

export async function signOut(): Promise<void> {
  await expireTokensInCookies();
}
