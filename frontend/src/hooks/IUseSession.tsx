import GameConfig from "@/types/GameConfig";
import Guess from "@/types/Guess";

export default interface IUseSession {
    updateGameConfig: (newConfig: Partial<GameConfig>) => void
    startGame: () => Promise<void>;
    handleGuess: (guess: Guess) => void;
    handleNextRound: () => void;
    endGame: () => void;
}