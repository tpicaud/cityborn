import { GameMode } from "@/enums/GameMode";
import Game from "@/types/Game";
import GameConfig from "@/types/GameConfig";
import { Session } from "@/types/Session";

export async function createSession(gameMode: GameMode): Promise<Session> {
    try {
        const response = await fetch('/api/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameMode }),
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la création de la partie');
        }

        const session = await response.json();
        return session
    } catch (e) {
        throw new Error(`Error creating new session: ${e}`)
    }
}

export async function createGame(gameConfig: GameConfig): Promise<Game> {
    try {
        const response = await fetch('/api/game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameConfig }),
        });

        const game = await response.json();
        return game;
    } catch (e) {
        throw new Error(`Error creating new game`);
    }

}