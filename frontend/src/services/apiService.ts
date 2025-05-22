import Game from "@/types/Game";
import GuessObject from "@/types/GuessObject";
import { Session } from "@/types/Session";

export async function fetchSession(sessionID: string): Promise<Session> {
    try {
        const response = await fetch(`/api/session/${sessionID}`);
        const session: Session = await response.json();
        return session;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération de la session: ${error}`);
    }
}

export async function fetchGame(gameID: string): Promise<Game> {
    try {
        const response = await fetch(`/api/game/${gameID}`);
        const game: Game = await response.json();
        return game;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération de la session: ${error}`);
    }
}

export async function fetchGuessObjects(guessObjectsIds: string[]): Promise<GuessObject[]> {
    const response = await fetch('/api/guess-objects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guessObjectsIds }),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des guess objects');
    }

    return await response.json();
}