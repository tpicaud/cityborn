import { GameMode, PublicUser } from "@cityborn/types";
import { Game } from "@cityborn/types";
import { GameConfig } from "@cityborn/types";
import { GuessObject } from "@cityborn/types";
import { Session } from "@cityborn/types";

const REST_BACKEND_URL = process.env.NEXT_PUBLIC_REST_BACKEND_URL!;

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {

    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
        ...options,
    });
    
    let data: any;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.message || data?.error || response.statusText || 'Unknown error');
    }

    return data as T;
}


//////////////////
// Auth service //
//////////////////

export async function getCurrentUser(): Promise<PublicUser | null> {
    const data = await apiFetch<any>(`/api/auth/me`, { method: 'GET' });
    console.log('api service : ', data);
    if (!data.user) return null;
    return data.user;
}

export async function signUp(username: string, email: string, password: string): Promise<void> {
    await apiFetch<void>(`/api/auth/sign-up`, {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
    });
}

export async function signIn(identifier: string, password: string): Promise<void> {
    await apiFetch<void>(`/api/auth/sign-in`, {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
    });
}

export async function signOut(): Promise<void> {
    await apiFetch<void>(`/api/auth/sign-out`, {
        method: 'POST',
    });
}

//////////////////////
// Sessions service //
//////////////////////

export async function createSession(gameMode: GameMode): Promise<Session> {
    // Appelle simplement l'API route Next.js (pas directement le backend REST)
    const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameMode }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.message || response.statusText;
        throw new Error(`Erreur lors de la création de la session: ${message}`);
    }

    // Le corps de la réponse est la session directement (déjà formatée par l’API route)
    const session: Session = await response.json();
    return session;
}

export async function fetchSession(sessionID: string): Promise<Session> {
    try {
        const response = await fetch(`${REST_BACKEND_URL}/session?sessionId=${sessionID}`);

        const data = await response.json();
        const session: Session = data.session;

        return session;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération de la session: ${error}`);
    }
}

export async function fetchGuessObjects(guessObjectsIds: string[]): Promise<GuessObject[]> {
    const response = await fetch(`${REST_BACKEND_URL}/guess-objects`, {
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
        const response = await fetch(`${REST_BACKEND_URL}/game`, {
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
        const response = await fetch(`${REST_BACKEND_URL}/game?gameId=${gameId}`);

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
        const response = await fetch(`${REST_BACKEND_URL}/sentence?score_type=${encodeURIComponent(score_type)}`);
        const data = await response.json();

        return data.sentence.sentence || '';
    } catch (error) {
        console.error('Erreur lors de la récupération de la phrase: ', error);
    }
    return '';
}