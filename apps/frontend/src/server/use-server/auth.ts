'use server';

import type {
  CreateUser,
  SignIn,
  SignInWithGoogle,
  VerifyEmailData,
} from '@cityborn/api';
import { type AppResult, toAppResult } from '@cityborn/client';
import {
  expireTokensInCookies,
  storeTokensInCookies,
} from '@/app/api/auth/utils';
import { getServerClient } from '@/lib/serverClient';

export async function signUp(data: CreateUser): Promise<AppResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signUp({ body: data });
  const apiResult = toAppResult(result);
  if (!apiResult.ok) return apiResult;
  const { access_token, refresh_token } = apiResult.data;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function signIn(data: SignIn): Promise<AppResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signIn({ body: data });
  const apiResult = toAppResult(result);
  if (!apiResult.ok) return apiResult;
  const { access_token, refresh_token } = apiResult.data;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function signInWithGoogle(
  data: SignInWithGoogle,
): Promise<AppResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signInWithGoogle({ body: data });
  const apiResult = toAppResult(result);
  if (!apiResult.ok) return apiResult;
  const { access_token, refresh_token } = apiResult.data;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function resendVerificationEmail(): Promise<AppResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.resendVerificationEmail({ body: {} });
  const r = toAppResult(result);
  if (!r.ok) return r;
  return { ok: true, data: undefined };
}

export async function verifyEmail(
  verifyEmailData: VerifyEmailData,
): Promise<AppResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.verifyEmail({ body: verifyEmailData });
  const r = toAppResult(result);
  if (!r.ok) return r;
  return { ok: true, data: undefined };
}

export async function signOut(): Promise<void> {
  await expireTokensInCookies();
}
