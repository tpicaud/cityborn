import { ApiError } from "@cityborn/errors";
import { Game, GameConfig, SessionMode, GuessObject, PublicUser, Session, GameRecord } from "@cityborn/types";

//////////////////
// Auth service //
//////////////////

export async function getCurrentUser(): Promise<PublicUser | null> {
    const response = await fetch(`/api/auth/me`, { method: 'GET' });

    const data = await response.json();
    if (!data) throw new Error("Invalid server response");

    if (!response.ok) {
        throw new ApiError(data.code, data.message, data.statusCode);
    }

    return data.user as PublicUser || null;
}

export async function signUp(username: string, email: string, birthdate: Date, password: string): Promise<void> {
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

export async function signIn(identifier: string, password: string): Promise<void> {
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

export async function signOut(): Promise<void> {
    const response = await fetch(`/api/auth/sign-out`, { method: 'POST' });

    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(data.code, data.message, data.statusCode);
    }
}

export async function signInWithGoogle(idToken: string): Promise<void> {
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

export async function sendVerificationEmail(): Promise<void> {
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

export async function verifyEmail(verification_token: string): Promise<void> {
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

export async function getGameRecords(): Promise<GameRecord[]> {
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

export async function saveGameRecords(gameRecord: GameRecord): Promise<void> {
    const response = await fetch(`/api/user/game-records`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameRecord }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(data.code, data.message, data.statusCode);
    }
}

//////////////////////
// Sessions service //
//////////////////////

export async function createSession(mode: SessionMode): Promise<Session> {
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

export async function fetchSession(sessionId: string): Promise<Session> {
    const response = await fetch(`/api/session/${sessionId}`, { method: 'GET' });

    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(data.code, data.message, data.statusCode);
    }

    return data.session as Session;
}

export async function fetchGuessObjects(guessObjectsIds: string[]): Promise<GuessObject[]> {
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

export const getEndSentence = async (score_type: string): Promise<string> => {
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

export async function createSoloGame(gameConfig: GameConfig) {
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

// export async function fetchGame(gameId: string): Promise<Game> {
//     const response = await fetch(`/api/game/${gameId}`);

//     const data = await response.json();

//     if (!response.ok) {
//         throw new ApiError(data.code, data.message, data.statusCode);
//     }

//     return data.game;
// }