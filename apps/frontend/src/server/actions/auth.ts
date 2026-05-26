'use server';

import {
  expireTokensInCookies,
  storeTokensInCookies,
} from '@/app/api/auth/utils';
import { throwOnError } from '@/lib/actionUtils';
import { getServerClient } from '@/lib/serverClient';

export async function signUp(
  username: string,
  email: string,
  password: string,
): Promise<void> {
  const client = await getServerClient();
  const result = await client.auth.signUp({
    body: { username, email, password },
  });
  throwOnError(result);
  await storeTokensInCookies(
    result.body.access_token,
    result.body.refresh_token,
  );
}

export async function signIn(
  identifier: string,
  password: string,
): Promise<void> {
  const client = await getServerClient();
  const result = await client.auth.signIn({ body: { identifier, password } });
  throwOnError(result);
  await storeTokensInCookies(
    result.body.access_token,
    result.body.refresh_token,
  );
}

export async function signInWithGoogle(idToken: string): Promise<void> {
  const client = await getServerClient();
  const result = await client.auth.signInWithGoogle({ body: { idToken } });
  throwOnError(result);
  await storeTokensInCookies(
    result.body.access_token,
    result.body.refresh_token,
  );
}

export async function signOut(): Promise<void> {
  await expireTokensInCookies();
}
