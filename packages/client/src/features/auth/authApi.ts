import type {
  ApiResult,
  AuthResponse,
  CreateUser,
  PasswordResetRequestResponse,
  PasswordResetToken,
  PublicUser,
  RequestPasswordReset,
  ResetPassword,
  SignIn,
  SignInWithApple,
  SignInWithGoogle,
  User,
  VerifyEmailData,
} from '@cityborn/api';
import { toApiResult } from '@cityborn/api';
import type { ApiClient } from '../../api/createApiClient';
import type { TokenStorage } from '../../platform/tokenStorage';

export interface AuthApi {
  requestPasswordReset(
    data: RequestPasswordReset,
  ): Promise<ApiResult<PasswordResetRequestResponse>>;
  resetPassword(data: ResetPassword): Promise<ApiResult<void>>;
  validatePasswordResetToken(
    data: PasswordResetToken,
  ): Promise<ApiResult<void>>;
  getCurrentUser(): Promise<User | null>;
  signIn(data: SignIn): Promise<ApiResult<User>>;
  signUp(data: CreateUser): Promise<ApiResult<User>>;
  signInWithGoogle(data: SignInWithGoogle): Promise<ApiResult<User>>;
  signInWithApple(data: SignInWithApple): Promise<ApiResult<User>>;
  signOut(): Promise<void>;
  deleteUser(): Promise<ApiResult<void>>;
  resendVerificationEmail(): Promise<ApiResult<void>>;
  verifyEmail(data: VerifyEmailData): Promise<ApiResult<PublicUser>>;
}

export function createAuthApi(
  client: Pick<ApiClient, 'auth'>,
  tokenStorage: TokenStorage,
): AuthApi {
  const storeSession = async (
    result: ApiResult<AuthResponse>,
  ): Promise<ApiResult<User>> => {
    if (!result.ok) return result;
    const { access_token, refresh_token, user } = result.data;
    await tokenStorage.setTokens(access_token, refresh_token);
    return { ok: true, data: user };
  };

  const toVoidResult = <T>(result: ApiResult<T>): ApiResult<void> => {
    if (!result.ok) return result;
    return { ok: true, data: undefined };
  };

  return {
    async requestPasswordReset(data) {
      return toApiResult(
        await client.auth.requestPasswordReset({ body: data }),
      );
    },
    async resetPassword(data) {
      return toVoidResult(
        toApiResult(await client.auth.resetPassword({ body: data })),
      );
    },
    async validatePasswordResetToken(data) {
      return toVoidResult(
        toApiResult(
          await client.auth.validatePasswordResetToken({ body: data }),
        ),
      );
    },
    async getCurrentUser() {
      try {
        const [accessToken, refreshToken] = await Promise.all([
          tokenStorage.getAccessToken(),
          tokenStorage.getRefreshToken(),
        ]);
        if (!accessToken && !refreshToken) return null;
        const result = await client.auth.me();
        return result.status === 200 ? result.body : null;
      } catch {
        return null;
      }
    },

    async signIn(data) {
      return storeSession(
        toApiResult(await client.auth.signIn({ body: data })),
      );
    },

    async signUp(data) {
      return storeSession(
        toApiResult(await client.auth.signUp({ body: data })),
      );
    },

    async signInWithGoogle(data) {
      return storeSession(
        toApiResult(await client.auth.signInWithGoogle({ body: data })),
      );
    },

    async signInWithApple(data) {
      return storeSession(
        toApiResult(await client.auth.signInWithApple({ body: data })),
      );
    },

    async signOut() {
      await tokenStorage.clearTokens();
    },

    async deleteUser() {
      return toVoidResult(
        toApiResult(await client.auth.deleteUser({ body: {} })),
      );
    },

    async resendVerificationEmail() {
      return toVoidResult(
        toApiResult(await client.auth.resendVerificationEmail({ body: {} })),
      );
    },

    async verifyEmail(data) {
      return toApiResult(await client.auth.verifyEmail({ body: data }));
    },
  };
}
