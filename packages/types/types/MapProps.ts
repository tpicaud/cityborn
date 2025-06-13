import { Coord } from "./Coord";
import { Guess } from "./Guess";
import { Game } from "./Game";

export interface MapProps {
    center: Coord;
    zoom: number,
    preGuess: Guess | undefined;
    game: Game,
    localPlayerID: string,
    handlePreGuess: (value: Guess) => void;
}