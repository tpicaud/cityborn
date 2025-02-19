import Guess from "@/types/Guess";
import { Result } from "@/types/Results";

export default interface IUseGame {
    handleGuess: (guess: Guess) => void;
    handleNextRound: () => void;
    recordResult: (result: Result) => void;
}