import { GuessObject } from "./GuessObject.js";

export interface Category {
    id: string;
    name: string;
    description?: string;
    guessObjects: GuessObject[];
}