import Guess from "@/types/Guess";

export default interface IUseGame {
    startGame: () => void;
    handleGuess: (guess: Guess) => void;
    handleNextRound: () => void;
}