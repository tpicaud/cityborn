import Coord from "./Coord";

export default interface GuessObject {
    name: string;
    description: string;
    image: string;
    city: string;
    coordinates: Coord
}