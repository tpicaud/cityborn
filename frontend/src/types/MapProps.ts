import Coord from "@/types/Coord";
import Guess from "@/types/Guess";
import Game from "./Game";

interface MapProps {
    center: Coord;
    zoom: number,
    preGuess: Guess | undefined;
    game: Game,
    localPlayerID: string,
    handlePreGuess: (value: Guess) => void;
}

export default MapProps;