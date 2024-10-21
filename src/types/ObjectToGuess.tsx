import Coord from "./Coord";

export default interface ObjectToGuess {
    name: string;
    description: string;
    image: string;
    location: {
        city: string,
        coordinates: Coord
    };
}