import { Game } from "./Game.js";
import { Guess } from "./Guess.js";

export interface GameComponentProps {
    game: Game,
    localPlayerID: string,
    handleGuess: (guess: Guess) => void,
    handleNextRound: () => void,
}