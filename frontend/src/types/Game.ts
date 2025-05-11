import GameConfig from "./GameConfig";
import GuessObject from "./GuessObject";
import { GameStatus } from "@/enums/GameStatus";
import Round from "./Round";
import { PlayerResults } from "./Results";
import { GameMode } from "@/enums/GameMode";

export default interface Game {
    id: string;
    sessionId: string;
    hostId: string;
    mode: GameMode;
    status: GameStatus;
    gameConfig: GameConfig;
    players: string[];
    state: GameState;
}

interface GameState {
    guessObjectsIds: string[];
    currentRound: Round | undefined;
    results: Record<string, PlayerResults>

    // Heavy params
    guessObjects: GuessObject[];
}