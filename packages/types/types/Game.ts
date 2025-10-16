import { GuessObject } from "./GuessObject.js";
import { GameStatus } from "../enums/GameStatus.js";
import { Round } from "./Round.js";
import { PlayerResults } from "./Results.js";
import { SessionMode } from "../enums/SessionMode.js";
import { GameConfig } from "./GameConfig.js";
import { Player } from "./Player.js";

export interface Game {
    id: string;
    status: GameStatus;
    state: GameState;
}

export interface GameState {
    guessObjectsIds: string[];
    results: Record<string, PlayerResults>

    // Round
    currentRound?: Round

    // Heavy params
    guessObjects?: GuessObject[];
}

export interface GameRecord {
    id: string;
    mode: SessionMode,
    gameConfig: GameConfig,
    players: Player[],
    guessObjectsIds: string[],
    results: Record<string, PlayerResults>,
    createdAt: string;
}

export type CreateGameRecord = Omit<GameRecord, "id" | "createdAt">;