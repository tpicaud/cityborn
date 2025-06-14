import { RoundStatus } from "../enums/RoundStatus.js";
import { Guess } from "./Guess.js";

export interface Round {
    status: RoundStatus
    guessObjectId: string;
    playersGuesses?: Record<string,Guess>;
}