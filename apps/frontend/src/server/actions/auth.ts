'use server';

import type {
  CreateUser,
  SignIn,
  SignInWithGoogle,
  VerifyEmailData,
} from '@cityborn/api';
import { type ApiResult, toApiResult } from '@cityborn/api';
import {
  expireTokensInCookies,
  storeTokensInCookies,
} from '@/app/api/auth/utils';
import { getServerClient } from '@/lib/serverClient';

export async function signUp(data: CreateUser): Promise<ApiResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signUp({ body: data });
  const apiResult = toApiResult(result);
  if (!apiResult.ok) return apiResult;
  const { access_token, refresh_token } = apiResult.data;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function signIn(data: SignIn): Promise<ApiResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signIn({ body: data });
  const apiResult = toApiResult(result);
  if (!apiResult.ok) return apiResult;
  const { access_token, refresh_token } = apiResult.data;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function signInWithGoogle(
  data: SignInWithGoogle,
): Promise<ApiResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.signInWithGoogle({ body: data });
  const apiResult = toApiResult(result);
  if (!apiResult.ok) return apiResult;
  const { access_token, refresh_token } = apiResult.data;
  await storeTokensInCookies(access_token, refresh_token);
  return { ok: true, data: undefined };
}

export async function resendVerificationEmail(): Promise<ApiResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.resendVerificationEmail();
  const r = toApiResult(result);
  if (!r.ok) return r;
  return { ok: true, data: undefined };
}

export async function verifyEmail(
  verifyEmailData: VerifyEmailData,
): Promise<ApiResult<void>> {
  const client = await getServerClient();
  const result = await client.auth.verifyEmail({ body: verifyEmailData });
  const r = toApiResult(result);
  if (!r.ok) return r;
  return { ok: true, data: undefined };
}

export async function signOut(): Promise<void> {
  await expireTokensInCookies();
}
