import Coord from "@/types/Coord";
import Guess from "@/types/Guess";
import GuessObject from "@/types/GuessObject";

interface MapProps {
    center: Coord;
    zoom: number,
    preGuess: Guess | undefined;
    guess: Guess | undefined;
    guessObject: GuessObject
    handlePreGuess: (value: Guess) => void;
}

export default MapProps;