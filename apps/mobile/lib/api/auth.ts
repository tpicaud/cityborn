import type {
  CreateUser,
  SignIn,
  SignInWithApple,
  SignInWithGoogle,
  User,
} from '@cityborn/api';
import { type AppResult, toAppResult } from '@cityborn/client';
import { client, tokenStorage } from './client';

export async function getCurrentUser(): Promise<User | null> {
  const access = await tokenStorage.getAccessToken();
  const refresh = await tokenStorage.getRefreshToken();
  if (!access && !refresh) return null;
  const result = await client.auth.me();
  return result.status === 200 ? result.body : null;
}

export async function signIn(data: SignIn): Promise<AppResult<User>> {
  const result = await client.auth.signIn({ body: data });
  const apiResult = toAppResult(result);
  if (!apiResult.ok) return apiResult;
  await tokenStorage.setTokens(
    apiResult.data.access_token,
    apiResult.data.refresh_token,
  );
  return { ok: true, data: apiResult.data.user };
}

export async function signUp(data: CreateUser): Promise<AppResult<User>> {
  const result = await client.auth.signUp({ body: data });
  const apiResult = toAppResult(result);
  if (!apiResult.ok) return apiResult;
  await tokenStorage.setTokens(
    apiResult.data.access_token,
    apiResult.data.refresh_token,
  );
  return { ok: true, data: apiResult.data.user };
}

export async function signOut(): Promise<void> {
  await tokenStorage.clearTokens();
}

export async function signInWithGoogle(
  data: SignInWithGoogle,
): Promise<AppResult<User>> {
  const result = await client.auth.signInWithGoogle({ body: data });
  const apiResult = toAppResult(result);
  if (!apiResult.ok) return apiResult;
  await tokenStorage.setTokens(
    apiResult.data.access_token,
    apiResult.data.refresh_token,
  );
  return { ok: true, data: apiResult.data.user };
}

export async function signInWithApple(
  data: SignInWithApple,
): Promise<AppResult<User>> {
  const result = await client.auth.signInWithApple({ body: data });
  const apiResult = toAppResult(result);
  if (!apiResult.ok) return apiResult;
  await tokenStorage.setTokens(
    apiResult.data.access_token,
    apiResult.data.refresh_token,
  );
  return { ok: true, data: apiResult.data.user };
}

export async function deleteUser(): Promise<AppResult<void>> {
  const result = await client.auth.deleteUser({ body: {} });
  const apiResult = toAppResult(result);
  if (!apiResult.ok) return apiResult;
  return { ok: true, data: undefined };
}

export async function resendVerificationEmail(): Promise<AppResult<void>> {
  const result = await client.auth.resendVerificationEmail({ body: {} });
  const apiResult = toAppResult(result);
  if (!apiResult.ok) return apiResult;
  return { ok: true, data: undefined };
}
