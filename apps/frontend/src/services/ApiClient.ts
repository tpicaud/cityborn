import { ApiError } from "@cityborn/errors";
import { CreateEvent, Game, GameConfig, GameRecord, GuessObject, PublicUser, Session, SessionMode } from "@cityborn/types";

export class ApiClient {

    constructor() { }

    //////////////////
    // Auth service //
    //////////////////

    async getCurrentUser(): Promise<PublicUser | null> {
        const response = await fetch(`/api/auth/me`, { method: 'GET' });

        const data = await response.json();
        if (!data) throw new Error("Invalid server response");

        if (!response.ok) {
            throw new ApiError(data.code, data.message, data.statusCode);
        }

        return data.user as PublicUser || null;
    }

    async signUp(username: string, email: string, birthdate: Date, password: string): Promise<void> {
        const response = await fetch(`/api/auth/sign-up`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, birthdate, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(data.code, data.message, data.statusCode);
        }
    }

    async signIn(identifier: string, password: string): Promise<void> {
        const response = await fetch(`/api/auth/sign-in`, {
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
        const response = await fetch(`/api/auth/sign-out`, { method: 'POST' });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(data.code, data.message, data.statusCode);
        }
    }

    async signInWithGoogle(idToken: string): Promise<void> {
        const response = await fetch(`/api/auth/sign-in-with-google`, {
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

    async sendVerificationEmail(): Promise<void> {
        const response = await fetch(`/api/auth/send-verification-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(data.code, data.message, data.statusCode);
        }
    }

    async verifyEmail(verification_token: string): Promise<void> {
        const response = await fetch(`/api/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ verification_token }),
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
        const response = await fetch(`/api/user/game-records`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(data.code, data.message, data.statusCode);
        }

        return data.gameRecords as GameRecord[];
    }

    async saveGameRecords(gameRecord: GameRecord): Promise<void> {
        const response = await fetch(`/api/user/game-records`, {
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
        const response = await fetch(`/api/session`, {
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

        return data.session as Session;
    }

    async fetchSession(sessionId: string): Promise<Session> {
        const response = await fetch(`/api/session/${sessionId}`, { method: 'GET' });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(data.code, data.message, data.statusCode);
        }

        return data.session as Session;
    }

    async fetchGuessObjects(guessObjectsIds: string[]): Promise<GuessObject[]> {
        const query = new URLSearchParams({
            ids: guessObjectsIds.join(','),
        });

        const response = await fetch(`/api/guess-objects?${query.toString()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ guessObjectsIds }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(data.code, data.message, data.statusCode);
        }

        return data.guessObjects;
    }

    async getEndSentence(score_type: string): Promise<string> {
        const response = await fetch(`/api/sentence?score_type=${encodeURIComponent(score_type)}`);

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(data.code, data.message, data.statusCode);
        }

        return data.sentence.sentence ?? '';
    }

    //////////////////
    // Game service //
    //////////////////

    async createSoloGame(gameConfig: GameConfig) {
        const response = await fetch(`/api/session/create-game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameConfig }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(data.code, data.message, data.statusCode);
        }

        const game: Game = data.game;

        return game;
    }

    //////////////////
    // Event service //
    //////////////////
    async trackEvent(event: CreateEvent): Promise<void> {
        const response = await fetch(`/api/event/track`, {
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