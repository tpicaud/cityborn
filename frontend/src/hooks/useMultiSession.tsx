import Game from "@/types/Game";
import IUseSession from "./IUseSession";
import Guess from "@/types/Guess";
import { GameSocket } from "./useGameSocket";

export function useMultiSession(
    game: Game | null,
    localPlayerID: string | null,
    gameSocket: GameSocket
): IUseSession {

    const startGame = async () => {
        if (!game || !localPlayerID) return;
        
        try {
            await gameSocket.startGame(game.id, localPlayerID)
        } catch (error) {
            console.error(`Erreur lors du démarrage de la partie: ${error}`);
        }
    }

    // Enregistrer un guess
    const handleGuess = async (guess: Guess) => {
        if (!game || !game.currentRound || !localPlayerID) return;
        try {
            await gameSocket.handleGuess(game.id, localPlayerID, guess)
        } catch (error) {
            console.error(`Erreur lors de l'enregistrement du guess: ${error}`);
        }
    };

    // Passer au round suivant (seulement l'hôte)
    const handleNextRound = async () => {
        if (!game || !game.currentRound || !localPlayerID) return;
        try {
            await gameSocket.handleNextRound(game.id, localPlayerID)
        } catch (error) {
            console.error(`Erreur lors du passage au round suivant: ${error}`);
        }
    };

    return {
        startGame,
        handleNextRound,
        handleGuess,
    };
}




