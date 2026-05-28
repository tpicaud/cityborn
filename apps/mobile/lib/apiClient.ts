import {
  type Category,
  createApiClient,
  type Game,
  type GameRecord,
  type HttpSuccessStatus,
  type Session,
  type SessionMode,
  throwOnError,
  type User,
} from '@cityborn/api';
import { tokenStorage } from './tokenStorage';
import { getBaseUrl } from './utils';

const client = createApiClient(getBaseUrl(), tokenStorage);

function assertOk<T extends { status: number; body: unknown }>(
  result: T,
): asserts result is Extract<T, { status: HttpSuccessStatus }> {
  throwOnError(result);
}

export const apiClient = {
  // Auth
  async getCurrentUser(): Promise<User | null> {
    const access = await tokenStorage.getAccessToken();
    const refresh = await tokenStorage.getRefreshToken();
    if (!access && !refresh) return null;
    const result = await client.auth.me();
    return result.status === 200 ? result.body : null;
  },

  async signIn(identifier: string, password: string): Promise<User> {
    const result = await client.auth.signIn({ body: { identifier, password } });
    assertOk(result);
    await tokenStorage.setTokens(
      result.body.access_token,
      result.body.refresh_token,
    );
    return result.body.user;
  },

  async signUp(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    const result = await client.auth.signUp({ body: data });
    assertOk(result);
    await tokenStorage.setTokens(
      result.body.access_token,
      result.body.refresh_token,
    );
    return result.body.user;
  },

  async signOut(): Promise<void> {
    await tokenStorage.clearTokens();
  },

  async signInWithGoogle(idToken: string): Promise<User> {
    const result = await client.auth.signInWithGoogle({ body: { idToken } });
    assertOk(result);
    await tokenStorage.setTokens(
      result.body.access_token,
      result.body.refresh_token,
    );
    return result.body.user;
  },

  async signInWithApple(
    identity_token: string,
    apple_user_id: string,
    details?: { email: string; family_name: string; given_name: string },
  ): Promise<User> {
    const result = await client.auth.signInWithApple({
      body: { identity_token, apple_user_id, details },
    });
    assertOk(result);
    await tokenStorage.setTokens(
      result.body.access_token,
      result.body.refresh_token,
    );
    return result.body.user;
  },

  async deleteUser(): Promise<void> {
    const result = await client.auth.deleteUser({ body: {} });
    throwOnError(result);
  },

  // Session
  async createSession(mode: SessionMode): Promise<Session> {
    const result = await client.session.createSession({ body: { mode } });
    assertOk(result);
    return result.body;
  },

  async fetchSession(id: string): Promise<Session> {
    const result = await client.session.getSession({ params: { id } });
    assertOk(result);
    return result.body;
  },

  async createSoloGame(session: Session): Promise<Game> {
    const result = await client.session.createGame({ body: session });
    assertOk(result);
    return result.body;
  },

  async endSoloGame(session: Session): Promise<void> {
    if (!session.currentGame) return;
    const { guessObjects: _removed, ...state } = session.currentGame.state;
    const result = await client.session.endSoloGame({
      body: { ...session, currentGame: { ...session.currentGame, state } },
    });
    throwOnError(result);
  },

  // Category
  async fetchCategories(): Promise<Category[]> {
    const result = await client.category.getCategories({ query: {} });
    assertOk(result);
    return result.body;
  },

  // User
  async getGameRecords(): Promise<GameRecord[]> {
    const result = await client.user.getGameRecords();
    assertOk(result);
    return result.body;
  },
};
