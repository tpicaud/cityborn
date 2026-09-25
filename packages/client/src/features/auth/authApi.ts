import type {
  ApiResult,
  AuthResponse,
  CreateUser,
  PublicUser,
  SignIn,
  SignInWithApple,
  SignInWithGoogle,
  User,
  VerifyEmailData,
} from '@cityborn/api';
import { toApiResult, unwrapApiResponse } from '@cityborn/api';
import type { ApiClient } from '../../api/createApiClient';
import type { TokenStorage } from '../../platform/tokenStorage';

export interface AuthApi {
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

export function createCookieAuthApi(client: Pick<ApiClient, 'auth'>): AuthApi {
  const toVoidResult = <T>(result: ApiResult<T>): ApiResult<void> => {
    if (!result.ok) return result;
    return { ok: true, data: undefined };
  };

  return {
    async getCurrentUser() {
      try {
        const result = await client.auth.me();
        return result.status === 200 ? result.body : null;
      } catch {
        return null;
      }
    },

    async signIn(data) {
      return toApiResult(await client.auth.cookieSignIn({ body: data }));
    },

    async signUp(data) {
      return toApiResult(await client.auth.cookieSignUp({ body: data }));
    },

    async signInWithGoogle(data) {
      return toApiResult(
        await client.auth.cookieSignInWithGoogle({ body: data }),
      );
    },

    async signInWithApple(data) {
      return toApiResult(
        await client.auth.cookieSignInWithApple({ body: data }),
      );
    },

    async signOut() {
      unwrapApiResponse(await client.auth.signOut({ body: {} }));
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
