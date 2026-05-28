import {
  type CreateUser,
  type SignIn,
  type SignInWithApple,
  type SignInWithGoogle,
  throwOnError,
  type User,
} from '@cityborn/api';
import { assertOk, client, tokenStorage } from './client';

export async function getCurrentUser(): Promise<User | null> {
  const access = await tokenStorage.getAccessToken();
  const refresh = await tokenStorage.getRefreshToken();
  if (!access && !refresh) return null;
  const result = await client.auth.me();
  return result.status === 200 ? result.body : null;
}

export async function signIn(data: SignIn): Promise<User> {
  const result = await client.auth.signIn({ body: data });
  assertOk(result);
  await tokenStorage.setTokens(
    result.body.access_token,
    result.body.refresh_token,
  );
  return result.body.user;
}

export async function signUp(data: CreateUser): Promise<User> {
  const result = await client.auth.signUp({ body: data });
  assertOk(result);
  await tokenStorage.setTokens(
    result.body.access_token,
    result.body.refresh_token,
  );
  return result.body.user;
}

export async function signOut(): Promise<void> {
  await tokenStorage.clearTokens();
}

export async function signInWithGoogle(data: SignInWithGoogle): Promise<User> {
  const result = await client.auth.signInWithGoogle({ body: data });
  assertOk(result);
  await tokenStorage.setTokens(
    result.body.access_token,
    result.body.refresh_token,
  );
  return result.body.user;
}

export async function signInWithApple(data: SignInWithApple): Promise<User> {
  const result = await client.auth.signInWithApple({ body: data });
  assertOk(result);
  await tokenStorage.setTokens(
    result.body.access_token,
    result.body.refresh_token,
  );
  return result.body.user;
}

export async function deleteUser(): Promise<void> {
  const result = await client.auth.deleteUser({ body: {} });
  throwOnError(result);
}
