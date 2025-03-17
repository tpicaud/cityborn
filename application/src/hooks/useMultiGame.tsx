import Game from "@/types/Game";
import IUseGame from "./IUseGame";
import Guess from "@/types/Guess";
import { GameSocket } from "./useGameSocket";

export function useMultiGame(
game: Game, localPlayerID: string, gameSocket: GameSocket): IUseGame {

    const startGame = async () => {
        if (!game) return;
        await gameSocket.startGame(game.id, localPlayerID)
    }

    // Enregistrer un guess
    const handleGuess = async (guess: Guess) => {
        if (!game || !game.currentRound) return;
        await gameSocket.handleGuess(game.id, localPlayerID, guess)
    };

    // Passer au round suivant (seulement l'hôte)
    const handleNextRound = async () => {
        if (!game || !game.currentRound) return;
        await gameSocket.handleNextRound(game.id, localPlayerID)
    };

    return {
        startGame,
        handleNextRound,
        handleGuess,
    };
}




