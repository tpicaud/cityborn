import Coord from "./Coord";

interface Guess {
    coordinates: Coord;
    distance: number;
    points: number;
    win: boolean;
}

export default Guess;