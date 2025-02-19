import Game from "./Game";
import Guess from "./Guess";
import { Result } from "./Results";

export interface GameComponentProps {
    game: Game,
    localPlayerID: string,
    handleGuess: (guess: Guess) => void,
    handleNextRound: () => void,
    recordResult: (result: Result) => void,
}