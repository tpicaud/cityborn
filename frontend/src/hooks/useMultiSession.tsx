import IUseSession from "./IUseSession";
import Guess from "@/types/Guess";
import { SessionSocket } from "./useSessionSocket";
import { useEffect, useState } from "react";
import Game from "@/types/Game";
import { Session } from "@/types/Session";

export function useMultiSession(
    sessionSocket: SessionSocket,
    localPlayerID: string | undefined,
    session: Session | undefined,
    setSession: React.Dispatch<React.SetStateAction<Session | undefined>>,
): IUseSession {


    ////////////////
    // useEffects //
    ////////////////
    useEffect(() => {
        setSession((prevSession) => {
            if (prevSession) {
                return {
                    ...prevSession,
                    currentGame: sessionSocket.gameUpdate
                }
            }
        })
    }, [sessionSocket.gameUpdate])


    ///////////////
    // Functions //
    ///////////////
    const updateGameConfig = async () => {
        if (!session || !localPlayerID) return;

        try {
            await sessionSocket.startGame(session.id, localPlayerID)
        } catch (error) {
            console.error(`Erreur lors du démarrage de la partie: ${error}`);
        }
    }

    const startGame = async (game: Game) => {
        if (!session || !localPlayerID) return;

        try {
            await sessionSocket.startGame(session.id, localPlayerID)
        } catch (error) {
            console.error(`Erreur lors du démarrage de la partie: ${error}`);
        }
    }

    // Enregistrer un guess
    const handleGuess = async (guess: Guess) => {
        if (!session?.currentGame || !session?.currentGame.currentRound || !localPlayerID) return;
        try {
            await sessionSocket.handleGuess(session.id, localPlayerID, guess)
        } catch (error) {
            console.error(`Erreur lors de l'enregistrement du guess: ${error}`);
        }
    };

    // Passer au round suivant (seulement l'hôte)
    const handleNextRound = async () => {
        if (!session?.currentGame || !session?.currentGame.currentRound || !localPlayerID) return;
        try {
            await sessionSocket.handleNextRound(session.id, localPlayerID)
        } catch (error) {
            console.error(`Erreur lors du passage au round suivant: ${error}`);
        }
    };

    // Terminer la partie
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




