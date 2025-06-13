import { RoundStatus } from "../enums/RoundStatus";
import { Guess } from "./Guess";

export interface Round {
    status: RoundStatus
    guessObjectId: string;
    playersGuesses?: Record<string,Guess>;
}