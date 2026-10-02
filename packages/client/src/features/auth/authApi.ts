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
import {
  ApiResponseError,
  toApiResult,
  unwrapApiResponse,
} from '@cityborn/api';
import type { ClientInferResponses } from '@ts-rest/core';
import type { ContractClient } from '../../api/contractClient';
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
  contractClient: Pick<ContractClient, 'auth'>,
  credentialsStrategy: AuthCredentialsStrategy,
): AuthApi {
  return {
    async getCurrentUser() {
      try {
        if (!(await credentialsStrategy.mayHoldCredentials())) return null;
        const result: ClientInferResponses<AppContract['auth']['me']> =
          await contractClient.auth.me();
        if (result.status === 401) return null;
        return unwrapApiResponse(result);
      } catch (error: unknown) {
        if (error instanceof ApiResponseError && error.statusCode === 401) {
          return null;
        }
        throw error;
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
        toApiResult(await contractClient.auth.deleteUser({ body: {} })),
      );
    },

    async resendVerificationEmail() {
      return toVoidResult(
        toApiResult(
          await contractClient.auth.resendVerificationEmail({ body: {} }),
        ),
      );
    },

    async verifyEmail(data) {
      return toApiResult(await contractClient.auth.verifyEmail({ body: data }));
    },
  };
}

function createBearerCredentialsStrategy(
  contractClient: Pick<ContractClient, 'auth'>,
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
      return storeTokens(
        toApiResult(await contractClient.auth.signIn({ body: data })),
      );
    },

    async signUp(data) {
      return storeTokens(
        toApiResult(await contractClient.auth.signUp({ body: data })),
      );
    },

    async signInWithGoogle(data) {
      return storeTokens(
        toApiResult(await contractClient.auth.signInWithGoogle({ body: data })),
      );
    },

    async signInWithApple(data) {
      return storeTokens(
        toApiResult(await contractClient.auth.signInWithApple({ body: data })),
      );
    },

    async signOut() {
      const refreshToken: string | null = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await contractClient.auth
          .signOut({
            body: {},
            extraHeaders: { authorization: `Bearer ${refreshToken}` },
          })
          .catch(() => undefined);
      }
      await tokenStorage.clearTokens();
    },

    async updatePassword(data) {
      return storeTokens(
        toApiResult(await contractClient.auth.updatePassword({ body: data })),
      );
    },
  };
}

function createCookieCredentialsStrategy(
  contractClient: Pick<ContractClient, 'auth'>,
): AuthCredentialsStrategy {
  return {
    async mayHoldCredentials() {
      return true;
    },

    async signIn(data) {
      return toApiResult(
        await contractClient.auth.cookie.signIn({ body: data }),
      );
    },

    async signUp(data) {
      return toApiResult(
        await contractClient.auth.cookie.signUp({ body: data }),
      );
    },

    async signInWithGoogle(data) {
      return toApiResult(
        await contractClient.auth.cookie.signInWithGoogle({ body: data }),
      );
    },

    async signInWithApple(data) {
      return toApiResult(
        await contractClient.auth.cookie.signInWithApple({ body: data }),
      );
    },

    async signOut() {
      unwrapApiResponse(await contractClient.auth.signOut({ body: {} }));
    },

    async updatePassword(data) {
      return toApiResult(
        await contractClient.auth.cookie.updatePassword({ body: data }),
      );
    },
  };
}

export function createAuthApi(
  contractClient: Pick<ContractClient, 'auth'>,
  tokenStorage: TokenStorage,
): AuthApi {
  return buildAuthApi(
    contractClient,
    createBearerCredentialsStrategy(contractClient, tokenStorage),
  );
}

export function createCookieAuthApi(
  contractClient: Pick<ContractClient, 'auth'>,
): AuthApi {
  return buildAuthApi(
    contractClient,
    createCookieCredentialsStrategy(contractClient),
  );
}
