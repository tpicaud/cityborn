'use server';

import {
  expireTokensInCookies,
  storeTokensInCookies,
} from '@/app/api/auth/utils';
import { type ActionResult, toActionResult } from '@/lib/actionUtils';
import { getServerClient } from '@/lib/serverClient';

type AuthTokens = { access_token: string; refresh_token: string };

export async function signUp(
  username: string,
  email: string,
  password: string,
): Promise<ActionResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signUp({
    body: { username, email, password },
  });
  const actionResult = toActionResult(result);
  if (!actionResult.ok) return actionResult;
  const { access_token, refresh_token } = result.body as AuthTokens;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function signIn(
  identifier: string,
  password: string,
): Promise<ActionResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signIn({ body: { identifier, password } });
  const actionResult = toActionResult(result);
  if (!actionResult.ok) return actionResult;
  const { access_token, refresh_token } = result.body as AuthTokens;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function signInWithGoogle(
  idToken: string,
): Promise<ActionResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signInWithGoogle({ body: { idToken } });
  const actionResult = toActionResult(result);
  if (!actionResult.ok) return actionResult;
  const { access_token, refresh_token } = result.body as AuthTokens;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function signOut(): Promise<void> {
  await expireTokensInCookies();
}
