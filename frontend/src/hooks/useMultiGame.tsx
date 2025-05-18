import IUseSession from "./IUseSession";
import Guess from "@/types/Guess";
import { useState } from "react";
import { useSocket } from "./useSocket";
import { Session } from "@/types/Session";
import GameConfig from "@/types/GameConfig";
import Game from "@/types/Game";

export function useMultiGame(
    localPlayerID: string | undefined,
): IUseGame {

    const [game, setGame] = useState<Game>();
    const { connected, emit, on, off, socket } = useSocket();


    ////////////////////
    // Game functions //
    ////////////////////
    const join = async () => {
        if (!game || !localPlayerID) throw new Error('Joueur ou game non initialisé');

        const playerID = localPlayerID;
        const gameID = game.id;
        return new Promise<void>((resolve, reject) => {
            emit('game:join', gameID, playerID, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const leave = async () => {
        if (!game || !localPlayerID) throw new Error('Joueur ou game non initialisé');

        return new Promise<void>((resolve, reject) => {
            emit('game:leave', (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const handleGuess = async (guess: Guess) => {
        if (!game || !localPlayerID) throw new Error('Joueur ou game non initialisé');

        const playerID = localPlayerID;
        return new Promise<void>((resolve, reject) => {
            emit('game:guess', guess, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });

        if (!session?.currentGame || !session?.currentGame.currentRound || !localPlayerID) return;
        try {
            await sessionSocket.handleGuess(session.id, localPlayerID, guess)
        } catch (error) {
            console.error(`Erreur lors de l'enregistrement du guess: ${error}`);
        }
    };

    const handleNextRound = async () => {
        if (!session?.currentGame || !session?.currentGame.currentRound || !localPlayerID) return;
        try {
            await sessionSocket.handleNextRound(session.id, localPlayerID)
        } catch (error) {
            console.error(`Erreur lors du passage au round suivant: ${error}`);
        }
    };

    const endGame = async () => {
        if (!session?.currentGame || !session?.currentGame.currentRound || !localPlayerID) return;
        try {
            await sessionSocket.handleNextRound(session.id, localPlayerID)
        } catch (error) {
            console.error(`Erreur lors du passage au round suivant: ${error}`);
        }
    };

    return {
        updateGameConfig,
        startGame,
        handleNextRound,
        handleGuess,
        endGame
    };
}




