'use server';

import type {
  ApiResult,
  CreateUser,
  PasswordResetRequestResponse,
  PasswordResetToken,
  RequestPasswordReset,
  ResetPassword,
  SignIn,
  SignInWithGoogle,
  User,
  VerifyEmailData,
} from '@cityborn/api';
import { getServerAuthApi } from '@/lib/serverClient';

export async function getCurrentUser(): Promise<User | null> {
  const authApi = await getServerAuthApi();
  return authApi.getCurrentUser();
}

export async function signUp(data: CreateUser): Promise<ApiResult<User>> {
  const authApi = await getServerAuthApi();
  return authApi.signUp(data);
}

export async function signIn(data: SignIn): Promise<ApiResult<User>> {
  const authApi = await getServerAuthApi();
  return authApi.signIn(data);
}

export async function signInWithGoogle(
  data: SignInWithGoogle,
): Promise<ApiResult<User>> {
  const authApi = await getServerAuthApi();
  return authApi.signInWithGoogle(data);
}

export async function resendVerificationEmail(): Promise<ApiResult<void>> {
  const authApi = await getServerAuthApi();
  return authApi.resendVerificationEmail();
}

export async function verifyEmail(
  data: VerifyEmailData,
): Promise<ApiResult<void>> {
  const authApi = await getServerAuthApi();
  const result = await authApi.verifyEmail(data);
  if (!result.ok) return result;
  return { ok: true, data: undefined };
}

export async function signOut(): Promise<void> {
  const authApi = await getServerAuthApi();
  await authApi.signOut();
}

export async function requestPasswordReset(
  data: RequestPasswordReset,
): Promise<ApiResult<PasswordResetRequestResponse>> {
  const authApi = await getServerAuthApi();
  return authApi.requestPasswordReset(data);
}

export async function resetPassword(
  data: ResetPassword,
): Promise<ApiResult<void>> {
  const authApi = await getServerAuthApi();
  return authApi.resetPassword(data);
}

export async function validatePasswordResetToken(
  data: PasswordResetToken,
): Promise<ApiResult<void>> {
  const authApi = await getServerAuthApi();
  return authApi.validatePasswordResetToken(data);
}
