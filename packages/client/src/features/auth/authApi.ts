import type {
  ApiResult,
  AppContract,
  AuthResponse,
  CreateUser,
  PublicUser,
  SignIn,
  SignInWithApple,
  SignInWithGoogle,
  UpdatePassword,
  User,
  VerifyEmailData,
} from '@cityborn/api';
import { toApiResult, unwrapApiResponse } from '@cityborn/api';
import type { ClientInferResponses } from '@ts-rest/core';
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
  updatePassword(data: UpdatePassword): Promise<ApiResult<User>>;
  resendVerificationEmail(): Promise<ApiResult<void>>;
  verifyEmail(data: VerifyEmailData): Promise<ApiResult<PublicUser>>;
}

interface AuthCredentialsStrategy
  extends Pick<
    AuthApi,
    | 'signIn'
    | 'signUp'
    | 'signInWithGoogle'
    | 'signInWithApple'
    | 'signOut'
    | 'updatePassword'
  > {
  mayHoldCredentials(): Promise<boolean>;
}

function toVoidResult<T>(result: ApiResult<T>): ApiResult<void> {
  if (!result.ok) return result;
  return { ok: true, data: undefined };
}

function buildAuthApi(
  client: Pick<ApiClient, 'auth'>,
  credentialsStrategy: AuthCredentialsStrategy,
): AuthApi {
  return {
    async getCurrentUser() {
      try {
        if (!(await credentialsStrategy.mayHoldCredentials())) return null;
        const result: ClientInferResponses<AppContract['auth']['me']> =
          await client.auth.me();
        return result.status === 200 ? result.body : null;
      } catch {
        return null;
      }
    },

    signIn: credentialsStrategy.signIn,
    signUp: credentialsStrategy.signUp,
    signInWithGoogle: credentialsStrategy.signInWithGoogle,
    signInWithApple: credentialsStrategy.signInWithApple,
    signOut: credentialsStrategy.signOut,
    updatePassword: credentialsStrategy.updatePassword,

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

function createBearerCredentialsStrategy(
  client: Pick<ApiClient, 'auth'>,
  tokenStorage: TokenStorage,
): AuthCredentialsStrategy {
  const storeTokens = async (
    result: ApiResult<AuthResponse>,
  ): Promise<ApiResult<User>> => {
    if (!result.ok) return result;
    const { access_token, refresh_token, user } = result.data;
    await tokenStorage.setTokens(access_token, refresh_token);
    return { ok: true, data: user };
  };

  return {
    async mayHoldCredentials() {
      const [accessToken, refreshToken]: [string | null, string | null] =
        await Promise.all([
          tokenStorage.getAccessToken(),
          tokenStorage.getRefreshToken(),
        ]);
      return Boolean(accessToken || refreshToken);
    },

    async signIn(data) {
      return storeTokens(toApiResult(await client.auth.signIn({ body: data })));
    },

    async signUp(data) {
      return storeTokens(toApiResult(await client.auth.signUp({ body: data })));
    },

    async signInWithGoogle(data) {
      return storeTokens(
        toApiResult(await client.auth.signInWithGoogle({ body: data })),
      );
    },

    async signInWithApple(data) {
      return storeTokens(
        toApiResult(await client.auth.signInWithApple({ body: data })),
      );
    },

    async signOut() {
      await tokenStorage.clearTokens();
    },

    async updatePassword(data) {
      return storeTokens(
        toApiResult(await client.auth.updatePassword({ body: data })),
      );
    },
  };
}

function createCookieCredentialsStrategy(
  client: Pick<ApiClient, 'auth'>,
): AuthCredentialsStrategy {
  return {
    async mayHoldCredentials() {
      return true;
    },

    async signIn(data) {
      return toApiResult(await client.auth.cookie.signIn({ body: data }));
    },

    async signUp(data) {
      return toApiResult(await client.auth.cookie.signUp({ body: data }));
    },

    async signInWithGoogle(data) {
      return toApiResult(
        await client.auth.cookie.signInWithGoogle({ body: data }),
      );
    },

    async signInWithApple(data) {
      return toApiResult(
        await client.auth.cookie.signInWithApple({ body: data }),
      );
    },

    async signOut() {
      unwrapApiResponse(await client.auth.signOut({ body: {} }));
    },

    async updatePassword(data) {
      return toApiResult(
        await client.auth.cookie.updatePassword({ body: data }),
      );
    },
  };
}

export function createAuthApi(
  client: Pick<ApiClient, 'auth'>,
  tokenStorage: TokenStorage,
): AuthApi {
  return buildAuthApi(
    client,
    createBearerCredentialsStrategy(client, tokenStorage),
  );
}

export function createCookieAuthApi(client: Pick<ApiClient, 'auth'>): AuthApi {
  return buildAuthApi(client, createCookieCredentialsStrategy(client));
}
