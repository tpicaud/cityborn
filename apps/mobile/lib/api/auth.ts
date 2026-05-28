import { throwOnError, type User } from '@cityborn/api';
import { assertOk, client, tokenStorage } from './client';

export async function getCurrentUser(): Promise<User | null> {
  const access = await tokenStorage.getAccessToken();
  const refresh = await tokenStorage.getRefreshToken();
  if (!access && !refresh) return null;
  const result = await client.auth.me();
  return result.status === 200 ? result.body : null;
}

export async function signIn(identifier: string, password: string): Promise<User> {
  const result = await client.auth.signIn({ body: { identifier, password } });
  assertOk(result);
  await tokenStorage.setTokens(result.body.access_token, result.body.refresh_token);
  return result.body.user;
}

export async function signUp(data: {
  username: string;
  email: string;
  password: string;
}): Promise<User> {
  const result = await client.auth.signUp({ body: data });
  assertOk(result);
  await tokenStorage.setTokens(result.body.access_token, result.body.refresh_token);
  return result.body.user;
}

export async function signOut(): Promise<void> {
  await tokenStorage.clearTokens();
}

export async function signInWithGoogle(idToken: string): Promise<User> {
  const result = await client.auth.signInWithGoogle({ body: { idToken } });
  assertOk(result);
  await tokenStorage.setTokens(result.body.access_token, result.body.refresh_token);
  return result.body.user;
}

export async function signInWithApple(
  identity_token: string,
  apple_user_id: string,
  details?: { email: string; family_name: string; given_name: string },
): Promise<User> {
  const result = await client.auth.signInWithApple({
    body: { identity_token, apple_user_id, details },
  });
  assertOk(result);
  await tokenStorage.setTokens(result.body.access_token, result.body.refresh_token);
  return result.body.user;
}

export async function deleteUser(): Promise<void> {
  const result = await client.auth.deleteUser({ body: {} });
  throwOnError(result);
}
