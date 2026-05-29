'use server';

import type { CreateUser, SignIn, SignInWithGoogle } from '@cityborn/api';
import {
  expireTokensInCookies,
  storeTokensInCookies,
} from '@/app/api/auth/utils';
import { type ActionResult, toActionResult } from '@cityborn/api';
import { getServerClient } from '@/lib/serverClient';

export async function signUp(data: CreateUser): Promise<ActionResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signUp({ body: data });
  const actionResult = toActionResult(result);
  if (!actionResult.ok) return actionResult;
  const { access_token, refresh_token } = actionResult.data;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function signIn(data: SignIn): Promise<ActionResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signIn({ body: data });
  const actionResult = toActionResult(result);
  if (!actionResult.ok) return actionResult;
  const { access_token, refresh_token } = actionResult.data;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function signInWithGoogle(
  data: SignInWithGoogle,
): Promise<ActionResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signInWithGoogle({ body: data });
  const actionResult = toActionResult(result);
  if (!actionResult.ok) return actionResult;
  const { access_token, refresh_token } = actionResult.data;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function signOut(): Promise<void> {
  await expireTokensInCookies();
}
