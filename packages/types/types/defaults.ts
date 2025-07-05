import { Guess } from "./Guess.js";

export const defaultGuess: Readonly<Guess> = {
    coordinates: { lat: 0, lng: 0 },
    distance: -1,
    points: 0,
    win: false
};
