import Coord from "@/types/Coord";
import Guess from "@/types/Guess";
import Round from "./Round";

interface MapProps {
    center: Coord;
    zoom: number,
    preGuess: Guess | undefined;
    currentRound: Round
    handlePreGuess: (value: Guess) => void;
}

export default MapProps;