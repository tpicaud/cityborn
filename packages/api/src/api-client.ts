import {
  TokenStorage,
  User,
  CreateUser,
  GameRecord,
  SessionMode,
  Session,
  Category,
  CreateEvent,
  Game,
  GuessObject,
  Sentence,
} from '@cityborn/types';
import { AuthFetch } from './auth-fetch.js';

export class ApiClient {
  private authFetch: AuthFetch;

  constructor(baseURL: string, tokenStorage: TokenStorage) {
    this.authFetch = new AuthFetch(baseURL, tokenStorage);
  }

  //////////////////
  // Auth service //
  //////////////////

  async getCurrentUser() {
    const access_token = await this.authFetch.tokenStorage.getAccessToken();
    const refresh_token = await this.authFetch.tokenStorage.getRefreshToken();

    if (!access_token && !refresh_token) {
      return null;
    }

    const data = await this.authFetch.get<{ user: User }>('/auth/me', {
      method: 'GET',
      cache: 'no-store',
    });
    return data.user;
  }

  async signUp(createUser: CreateUser): Promise<User> {
    const data = await this.authFetch.post<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>('/auth/sign-up', { ...createUser }, { includeAuth: false });

    await this.authFetch.tokenStorage.setTokens(
      data.access_token,
      data.refresh_token,
    );

    return data.user;
  }

  async signIn(identifier: string, password: string): Promise<User> {
    const data = await this.authFetch.post<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>('/auth/sign-in', { identifier, password }, { includeAuth: false });

    await this.authFetch.tokenStorage.setTokens(
      data.access_token,
      data.refresh_token,
    );
    return data.user;
  }

  async signOut() {
    await this.authFetch.tokenStorage.clearTokens();
  }

  async signInWithGoogle(idToken: string) {
    const res = await this.authFetch.post<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>('/auth/sign-in-with-google', { idToken }, { includeAuth: false });

    await this.authFetch.tokenStorage.setTokens(
      res.access_token,
      res.refresh_token,
    );
    return res.user;
  }

  async sendVerificationEmail() {
    await this.authFetch.post<void>('/auth/send-verification-email');
  }

  async verifyEmail(verification_token: string) {
    await this.authFetch.post<void>('/auth/verify-email', {
      verification_token,
    });
  }

  //////////////////
  // User service //
  //////////////////
  async getGameRecords(): Promise<GameRecord[]> {
    const data = await this.authFetch.get<{ gameRecords: GameRecord[] }>(
      '/user/game-records',
      {
        method: 'GET',
        cache: 'no-store',
      },
    );
    return data.gameRecords;
  }

  async saveGameRecord(gameRecord: GameRecord): Promise<void> {
    await this.authFetch.post<void>('/user/game-records', {
      gameRecord,
    });
  }

  //////////////////////
  // Sessions service //
  //////////////////////

  async createSession(mode: SessionMode): Promise<Session> {
    const data = await this.authFetch.post<{ session: Session }>('/session', {
      mode,
    });
    return data.session;
  }

  async fetchSession(sessionId: string): Promise<Session> {
    const data = await this.authFetch.get<{ session: Session }>(
      `/session/${sessionId}`,
      {
        method: 'GET',
        cache: 'no-store',
      },
    );
    return data.session;
  }

  async fetchCategories(): Promise<Category[]> {
    const data = await this.authFetch.get<{ categories: Category[] }>(
      '/category',
      {
        method: 'GET',
        cache: 'no-store',
      },
    );
    return data.categories;
  }

  async fetchGuessObjects(guessObjectsIds: string[]): Promise<GuessObject[]> {
    const query = new URLSearchParams({
      guessObjectsIds: guessObjectsIds.join(','),
    }).toString();

    const data = await this.authFetch.get<{ guessObjects: GuessObject[] }>(
      `/guess-objects?${query}`,
    );
    return data.guessObjects;
  }

  async getEndSentence(score_type: string): Promise<Sentence> {
    return await this.authFetch.get<Sentence>(
      `/sentence?score_type=${score_type}`,
      {
        method: 'GET',
        cache: 'no-store',
      },
    );
  }

  //////////////////
  // Game service //
  //////////////////

  async createSoloGame(session: Session): Promise<Game> {
    const data = await this.authFetch.post<{ game: Game }>(
      '/session/create-game',
      { session },
    );
    return data.game;
  }

  async endSoloGame(session: Session): Promise<void> {
    await this.authFetch.post<void>('/session/end-solo-game', { ...session });
  }

  //////////////////
  // Event service //
  //////////////////

  async trackEvent(event: CreateEvent): Promise<void> {
    await this.authFetch.post<void>('/event/track', {
      event,
    });
  }
}
