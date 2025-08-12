import { Game, GameConfig, GameMode, GuessObject, PublicUser, Session } from "@cityborn/types";

//////////////////
// Auth service //
//////////////////

export async function getCurrentUser(): Promise<PublicUser | null> {
    const response = await fetch(`/api/auth/me`, { method: 'GET' });

    const data = await response.json();
    if (!data) throw new Error("Invalid server response");

    if (!response.ok) {
        throw new Error(data.message || "Failed to create session");
    }

    return data.user as PublicUser || null;
}

export async function signUp(username: string, email: string, password: string): Promise<void> {
    const response = await fetch(`/api/auth/sign-up`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to sign up");
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
        throw new Error(data.message || "Failed to sign in");
    }
}

export async function signOut(): Promise<void> {
    const response = await fetch(`/api/auth/sign-out`, { method: 'POST' });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.message || "Failed to sign out");
    }
}

//////////////////////
// Sessions service //
//////////////////////

export async function createSession(gameMode: GameMode): Promise<Session> {
    const response = await fetch(`/api/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameMode }),
    });

    const data = await response.json().catch(() => null);
    if (!data) throw new Error("Invalid server response");

    if (!response.ok) {
        throw new Error(data.message || "Failed to create session");
    }

    if (!data.session) throw new Error('No session returned from create session');
    return data.session as Session;
}

export async function fetchSession(sessionID: string): Promise<Session> {
    const response = await fetch(`/api/session/${sessionID}`, { method: 'GET' });

    const data = await response.json().catch(() => null);
    if (!data) throw new Error("Invalid server response");

    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch session");
    }

    if (!data.session) throw new Error('No session returned from fetch session');
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

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des guess objects');
    }

    const data = await response.json();
    const guessObjects: GuessObject[] = data.guessObjects;

    return guessObjects;
}


//////////////////
// Game service //
//////////////////

export async function createSoloGame(gameConfig: GameConfig, hostID: string) {
    try {
        const response = await fetch(`/api/game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameConfig, hostID, gameMode: GameMode.SOLO, playersID: [hostID] }),
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        const game: Game = data.game;

        return game;
    } catch (error) {
        throw new Error(`Erreur lors de la création de la partie: ${error}`);
    }
}

export async function fetchGame(gameId: string): Promise<Game> {
    try {
        const response = await fetch(`/api/game/${gameId}`);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        const game: Game = data.game;

        return game;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération de la partie: ${error}`);
    }
}

export const getEndSentence = async (score_type: string): Promise<string> => {
    try {
        const response = await fetch(`/api/sentence?score_type=${encodeURIComponent(score_type)}`);
        const data = await response.json();

        return data.sentence.sentence || '';
    } catch (error) {
        console.error('Erreur lors de la récupération de la phrase: ', error);
    }
    return '';
}