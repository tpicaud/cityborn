import { Coord } from "./Coord";

export interface Guess {
    coordinates: Coord;
    distance: number;
    points: number;
    win: boolean;
}