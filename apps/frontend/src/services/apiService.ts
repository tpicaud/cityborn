import { GameMode } from "@/enums/GameMode";
import { Game } from "@cityborn/types";
import { GameConfig } from "@cityborn/types";
import { GuessObject } from "@cityborn/types";
import { Session } from "@cityborn/types";

//////////////////////
// Sessions service //
//////////////////////

export async function createSession(gameMode: GameMode): Promise<Session> {
    try {
        const response = await fetch(`/api/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameMode }),
        });

        const data = await response.json();
        return data.session;
    } catch (error) {
        throw new Error(`Erreur lors de la création de la session ${error}`);
    }
}

export async function fetchSession(sessionID: string): Promise<Session> {
    try {
        const response = await fetch(`/api/session/${sessionID}`);
        const session: Session = await response.json();
        return session;
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


//////////////////
// Game service //
//////////////////

export async function createSoloGame(gameConfig: GameConfig, hostID: string) {
    try {
        const response = await fetch(`/api/game/solo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameConfig, hostID }),
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data.game as Game;
    } catch (error) {
        throw new Error(`Erreur lors de la création de la partie: ${error}`);
    }
}




export async function fetchGame(gameID: string): Promise<Game> {
    try {
        const response = await fetch(`/api/game/multi?gameID=${encodeURIComponent(gameID)}`);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data.game as Game;
    } catch (error) {
        throw new Error(`Erreur lors de la récupération de la partie: ${error}`);
    }
}
