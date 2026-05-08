import { createApiClient } from '@cityborn/api';
import { ApiError, ErrorCode } from '@cityborn/errors';
import { tokenStorage } from './tokenStorage';
import { getBaseUrl } from './utils';

const client = createApiClient(getBaseUrl(), tokenStorage);

function throwOnError(result: { status: number; body: unknown }): void {
  if (result.status < 200 || result.status >= 300) {
    const body = result.body as { code?: string; message?: string; statusCode?: number };
    throw new ApiError(
      (body?.code ?? ErrorCode.UNKNOWN_ERROR) as ErrorCode,
      body?.message ?? 'Unexpected error',
      body?.statusCode ?? result.status,
    );
  }
}

export const apiClient = {
  // Auth
  async getCurrentUser() {
    const access = await tokenStorage.getAccessToken();
    const refresh = await tokenStorage.getRefreshToken();
    if (!access && !refresh) return null;
    const result = await client.auth.me();
    return result.status === 200 ? result.body : null;
  },

  async signIn(identifier: string, password: string) {
    const result = await client.auth.signIn({ body: { identifier, password } });
    throwOnError(result);
    if (result.status === 200) {
      await tokenStorage.setTokens(result.body.access_token, result.body.refresh_token);
      return result.body.user;
    }
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, 'Unexpected response', result.status);
  },

  async signUp(data: { username: string; email: string; password: string }) {
    const result = await client.auth.signUp({ body: data });
    throwOnError(result);
    if (result.status === 201) {
      await tokenStorage.setTokens(result.body.access_token, result.body.refresh_token);
      return result.body.user;
    }
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, 'Unexpected response', result.status);
  },

  async signOut() {
    await tokenStorage.clearTokens();
  },

  async signInWithGoogle(idToken: string) {
    const result = await client.auth.signInWithGoogle({ body: { idToken } });
    throwOnError(result);
    if (result.status === 200) {
      await tokenStorage.setTokens(result.body.access_token, result.body.refresh_token);
      return result.body.user;
    }
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, 'Unexpected response', result.status);
  },

  async signInWithApple(
    identity_token: string,
    apple_user_id: string,
    details?: { email: string; family_name: string; given_name: string },
  ) {
    const result = await client.auth.signInWithApple({
      body: { identity_token, apple_user_id, details },
    });
    throwOnError(result);
    if (result.status === 200) {
      await tokenStorage.setTokens(result.body.access_token, result.body.refresh_token);
      return result.body.user;
    }
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, 'Unexpected response', result.status);
  },

  async deleteUser() {
    const result = await client.auth.deleteUser({ body: {} });
    throwOnError(result);
  },

  // Session
  async createSession(
    mode: Parameters<typeof client.session.createSession>[0]['body']['mode'],
  ) {
    const result = await client.session.createSession({ body: { mode } });
    throwOnError(result);
    if (result.status === 201) return result.body;
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, 'Unexpected response', result.status);
  },

  async fetchSession(id: string) {
    const result = await client.session.getSession({ params: { id } });
    throwOnError(result);
    if (result.status === 200) return result.body;
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, 'Unexpected response', result.status);
  },

  async createSoloGame(
    session: Parameters<typeof client.session.createGame>[0]['body'],
  ) {
    const result = await client.session.createGame({ body: session });
    throwOnError(result);
    if (result.status === 200) return result.body;
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, 'Unexpected response', result.status);
  },

  async endSoloGame(
    session: Parameters<typeof client.session.endSoloGame>[0]['body'],
  ) {
    const result = await client.session.endSoloGame({ body: session });
    throwOnError(result);
  },

  // Category
  async fetchCategories() {
    const result = await client.category.getCategories({ query: {} });
    throwOnError(result);
    if (result.status === 200) return result.body;
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, 'Unexpected response', result.status);
  },

  // User
  async getGameRecords() {
    const result = await client.user.getGameRecords();
    throwOnError(result);
    if (result.status === 200) return result.body;
    throw new ApiError(ErrorCode.UNKNOWN_ERROR, 'Unexpected response', result.status);
  },
};
