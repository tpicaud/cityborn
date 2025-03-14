import Game from "./Game";
import Guess from "./Guess";

export interface GameComponentProps {
    game: Game,
    localPlayerID: string,
    handleGuess: (guess: Guess) => void,
    handleNextRound: () => void,
}