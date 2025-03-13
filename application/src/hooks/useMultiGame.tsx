import { useEffect, useState } from "react";
import Game from "@/types/Game";
import IUseGame from "./IUseGame";
import Guess from "@/types/Guess";

export function useMultiGame(
    game: Game,
    localPlayerID: string,
    setGame: React.Dispatch<React.SetStateAction<Game | null>>
): IUseGame {

    const startGame = async () => {
        if (!game || !game.currentRound) return;

        await fetch(`/api/game/${game.id}/start`, {
            method: "POST",
            body: JSON.stringify({
                playerID: localPlayerID,
            }),
            headers: { "Content-Type": "application/json" },
        });
    }

    // Enregistrer un guess
    const handleGuess = async (guess: Guess) => {
        if (!game || !game.currentRound) return;

        await fetch(`/api/game/${game.id}/start`, {
            method: "POST",
            body: JSON.stringify({
                playerID: localPlayerID,
                guess
            }),
            headers: { "Content-Type": "application/json" },
        });
    };

    // Passer au round suivant (seulement l'hôte)
    const handleNextRound = async () => {
        if (!game || !game.currentRound) return;

        await fetch(`/api/game/${game.id}/start`, {
            method: "PUT",
            body: JSON.stringify({
                playerID: localPlayerID,
            }),
            headers: { "Content-Type": "application/json" },
        });
    };

    return {
        startGame,
        handleNextRound,
        handleGuess,
    };
}




