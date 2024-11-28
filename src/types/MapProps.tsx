import Coord from "@/types/Coord";
import Guess from "@/types/Guess";

interface MapProps {
    center: Coord;
    zoom: number,
    preGuess: Guess | undefined;
    guess: Guess | undefined;
    answer: Coord;
    handlePreGuess: (value: Guess) => void;
}

export default MapProps;