import Coord from "./Coord";

export default interface GuessObject {
    name: string;
    category: string
    description: string;
    image: string;
    answer: {
        place_name: string,
        coordinates: {
            type: string,
            value: any
        }
    }
}