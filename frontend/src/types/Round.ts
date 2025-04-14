import { RoundStatus } from "@/enums/RoundStatus";
import Guess from "./Guess";

export default interface Round {
    status: RoundStatus
    guessObjectIndex: number;
    playersGuesses?: Record<string,Guess>;
}