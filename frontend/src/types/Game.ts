import GameConfig from "./GameConfig";
import GuessObject from "./GuessObject";
import { GameStatus } from "@/enums/GameStatus";
import Round from "./Round";
import { PlayerResults } from "./Results";

export default interface Game {
    id: string;
    status: GameStatus;
    gameConfig: GameConfig
    currentRound: Round | undefined;
    results: Record<string, PlayerResults>
    guessObjectsIds: string[];

    // Heavy params
    guessObjects: GuessObject[];
}