import Game from "@/types/Game";
import Guess from "@/types/Guess";
import { Result } from "@/types/Results";

export default interface IUseGame {
    game: Game
    handleGuess: (guess: Guess) => void;
    handleNextRound: () => void;
    recordResult: (result: Result) => void;
}