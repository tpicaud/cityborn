import Coord from "./Coord";

interface Guess {
    coordinates: Coord;
    distance: number;
    points: number;
}

export default Guess;