import { RoundStatus } from "@/enums/RoundStatus";
import Guess from "./Guess";

export default interface Round {
    status: RoundStatus
    guessObjectId: string;
    playersGuesses?: Record<string,Guess>;
}