import { GameConfig } from "./GameConfig.js";
import { GuessObject } from "./GuessObject.js";
import { GameStatus } from "../enums/GameStatus.js";
import { Round } from "./Round.js";
import { PlayerResults } from "./Results.js";
import { GameMode } from "../enums/GameMode.js";
import { Player } from "./Player.js";

export interface Game {
    id: string;
    hostID: string;
    mode: GameMode;
    status: GameStatus;
    gameConfig: GameConfig;
    players: Player[];
    state: GameState;
}

interface GameState {
    guessObjectsIds: string[];
    currentRound: Round | undefined;
    results: Record<string, PlayerResults>

    // Heavy params
    guessObjects?: GuessObject[];
}