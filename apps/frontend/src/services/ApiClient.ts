import { ApiError } from '@cityborn/errors';
import type {
  Category,
  CreateEvent,
  Game,
  GameRecord,
  GuessObject,
  PublicUser,
  ScoreType,
  Sentence,
  Session,
  SessionMode,
} from '@cityborn/types';
import { getOrCreateVisitorId } from '@/lib/visitorId';

export class ApiClient {
  constructor() {}

  private async apiFetch(input: string, init?: RequestInit) {
    // Headers
    const headers = new Headers(init?.headers || {});
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    headers.set('X-Visitor-Id', getOrCreateVisitorId());

    // Fetch
    const response = await fetch(input, { ...init, headers });
    return response;
  }

  //////////////////
  // Auth service //
  //////////////////

  async getCurrentUser(): Promise<PublicUser | null> {
    const response = await this.apiFetch(`/api/auth/me`, { method: 'GET' });

    const data = await response.json();
    if (!data) throw new Error('Invalid server response');

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }

    return (data as PublicUser) || null;
  }

  async signUp(
    username: string,
    email: string,
    password: string,
  ): Promise<void> {
    const response = await this.apiFetch(`/api/auth/sign-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }
  }

  async signIn(identifier: string, password: string): Promise<void> {
    const response = await this.apiFetch(`/api/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }
  }

  async signOut(): Promise<void> {
    const response = await this.apiFetch(`/api/auth/sign-out`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }
  }

  async signInWithGoogle(idToken: string): Promise<void> {
    const response = await this.apiFetch(`/api/auth/sign-in-with-google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }
  }

  //////////////////
  // User service //
  //////////////////

  async getGameRecords(): Promise<GameRecord[]> {
    const response = await this.apiFetch(`/api/user/game-records`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }

    return data as GameRecord[];
  }

  async saveGameRecords(gameRecord: GameRecord): Promise<void> {
    const response = await this.apiFetch(`/api/user/game-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameRecord),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }
  }

  //////////////////////
  // Sessions service //
  //////////////////////

  async createSession(mode: SessionMode): Promise<Session> {
    const response = await this.apiFetch(`/api/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }
    return data as Session;
  }

  async fetchSession(sessionId: string): Promise<Session> {
    const response = await this.apiFetch(`/api/session/${sessionId}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }

    return data as Session;
  }

  async fetchCategories(): Promise<Category[]> {
    const response = await this.apiFetch(`/api/category`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }
    return data;
  }

  async fetchGuessObjects(guessObjectsIds: string[]): Promise<GuessObject[]> {
    const query = new URLSearchParams({
      ids: guessObjectsIds.join(','),
    });

    const response = await this.apiFetch(
      `/api/guess-objects?${query.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guessObjectsIds }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }

    return data;
  }

  async getEndSentence(score_type: ScoreType): Promise<string> {
    const response = await this.apiFetch(
      `/api/sentence?score_type=${encodeURIComponent(score_type)}`,
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }

    return (data as Sentence).message ?? '';
  }

  //////////////////
  // Game service //
  //////////////////

  async createSoloGame(session: Session) {
    const response = await this.apiFetch(`/api/session/create-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }

    const game: Game = data;

    return game;
  }

  async endSoloGame(session: Session) {
    if (!session.currentGame) return;

    const lightSession: Session = {
      ...session,
      currentGame: {
        ...session.currentGame,
        state: {
          ...session.currentGame?.state,
          guessObjects: undefined,
        },
      },
    };

    const response = await this.apiFetch(`/api/session/end-solo-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lightSession),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }
  }

  //////////////////
  // Event service //
  //////////////////
  async trackEvent(event: CreateEvent): Promise<void> {
    const response = await this.apiFetch(`/api/event/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.code, data.message, data.statusCode);
    }
  }
}
