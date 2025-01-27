import { RoundStatus } from "@/enums/RoundStatus";
import Guess from "./Guess";
import GuessObject from "./GuessObject";

export default interface Round {
    status: RoundStatus
    guessObject: GuessObject;
    playersGuesses?: Record<string,Guess>;
}