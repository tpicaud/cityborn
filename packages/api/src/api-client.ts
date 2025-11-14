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
    return await this.authFetch.get<null | User>('/auth/me', {
      method: 'GET',
      cache: 'no-store',
    });
  }

  async signUp(createUser: CreateUser) {
    const tokens = await this.authFetch.post<{
      access_token: string;
      refresh_token: string;
    }>('/auth/sign-up', { ...createUser });

    await this.authFetch.tokenStorage.setTokens(
      tokens.access_token,
      tokens.refresh_token,
    );
  }

  async signIn(identifier: string, password: string): Promise<void> {
    const tokens = await this.authFetch.post<{
      access_token: string;
      refresh_token: string;
    }>('/auth/sign-in', { identifier, password });

    await this.authFetch.tokenStorage.setTokens(
      tokens.access_token,
      tokens.refresh_token,
    );
  }

  async signOut() {
    await this.authFetch.tokenStorage.clearTokens();
  }

  async signInWithGoogle(idToken: string) {
    await this.authFetch.post<void>('/auth/sign-in-with-google', { idToken });
  }

  async sendVerificationEmail() {
    await this.authFetch.post<void>('/auth/send-verification-email');
  }

  async verifyEmail(token: string) {
    await this.authFetch.post<void>('/auth/verify-email', { token });
  }

  //////////////////
  // User service //
  //////////////////
  async getGameRecords(): Promise<GameRecord[]> {
    return await this.authFetch.get<GameRecord[]>('/user/game-records', {
      method: 'GET',
      cache: 'no-store',
    });
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
    return await this.authFetch.post<Session>('/session', { mode });
  }

  async fetchSession(sessionId: string): Promise<Session> {
    return await this.authFetch.get<Session>(`/sessions/${sessionId}`, {
      method: 'GET',
      cache: 'no-store',
    });
  }

  async fetchCategories(): Promise<Category[]> {
    return await this.authFetch.get<Category[]>('/category', {
      method: 'GET',
      cache: 'no-store',
    });
  }

  async fetchGuessObjects(guessObjectsIds: string[]): Promise<string[]> {
    const query = new URLSearchParams({
      guessObjectsIds: guessObjectsIds.join(','),
    }).toString();

    return await this.authFetch.get<string[]>(`/guess-objects?${query}`);
  }

  async getEndSentence(score_type: string): Promise<string> {
    return await this.authFetch.get<string>(
      `/end-sentences?score_type=${score_type}`,
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
    return await this.authFetch.post<Game>('/session/create-game', { session });
  }

  async endSoloGame(session: Session): Promise<void> {
    await this.authFetch.post<void>('/session/end-solo-game', { session });
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
