import type {
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
import { ApiResponseError, unwrapApiResponse } from '@cityborn/api';
import type { ClientInferResponses } from '@ts-rest/core';
import type { ContractClient } from '../../api/contractClient';
import type { TokenStorage } from '../../platform/tokenStorage';

export interface AuthApi {
  getCurrentUser(): Promise<User | null>;
  signIn(data: SignIn): Promise<User>;
  signUp(data: CreateUser): Promise<User>;
  signInWithGoogle(data: SignInWithGoogle): Promise<User>;
  signInWithApple(data: SignInWithApple): Promise<User>;
  signOut(): Promise<void>;
  deleteUser(): Promise<void>;
  updatePassword(data: UpdatePassword): Promise<User>;
  resendVerificationEmail(): Promise<void>;
  verifyEmail(data: VerifyEmailData): Promise<PublicUser>;
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
      unwrapApiResponse(await contractClient.auth.deleteUser({ body: {} }));
    },

    async resendVerificationEmail() {
      unwrapApiResponse(
        await contractClient.auth.resendVerificationEmail({ body: {} }),
      );
    },

    async verifyEmail(data) {
      return unwrapApiResponse(
        await contractClient.auth.verifyEmail({ body: data }),
      );
    },
  };
}

function createBearerCredentialsStrategy(
  contractClient: Pick<ContractClient, 'auth'>,
  tokenStorage: TokenStorage,
): AuthCredentialsStrategy {
  const storeTokens = async ({
    access_token,
    refresh_token,
    user,
  }: AuthResponse): Promise<User> => {
    await tokenStorage.setTokens(access_token, refresh_token);
    return user;
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
        unwrapApiResponse(await contractClient.auth.signIn({ body: data })),
      );
    },

    async signUp(data) {
      return storeTokens(
        unwrapApiResponse(await contractClient.auth.signUp({ body: data })),
      );
    },

    async signInWithGoogle(data) {
      return storeTokens(
        unwrapApiResponse(
          await contractClient.auth.signInWithGoogle({ body: data }),
        ),
      );
    },

    async signInWithApple(data) {
      return storeTokens(
        unwrapApiResponse(
          await contractClient.auth.signInWithApple({ body: data }),
        ),
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
        unwrapApiResponse(
          await contractClient.auth.updatePassword({ body: data }),
        ),
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
      return unwrapApiResponse(
        await contractClient.auth.cookie.signIn({ body: data }),
      );
    },

    async signUp(data) {
      return unwrapApiResponse(
        await contractClient.auth.cookie.signUp({ body: data }),
      );
    },

    async signInWithGoogle(data) {
      return unwrapApiResponse(
        await contractClient.auth.cookie.signInWithGoogle({ body: data }),
      );
    },

    async signInWithApple(data) {
      return unwrapApiResponse(
        await contractClient.auth.cookie.signInWithApple({ body: data }),
      );
    },

    async signOut() {
      unwrapApiResponse(await contractClient.auth.signOut({ body: {} }));
    },

    async updatePassword(data) {
      return unwrapApiResponse(
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
