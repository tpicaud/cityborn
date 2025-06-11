import GameConfig from "./GameConfig";
import GuessObject from "./GuessObject";
import { GameStatus } from "@/enums/GameStatus";
import Round from "./Round";
import { PlayerResults } from "./Results";
import { GameMode } from "@/enums/GameMode";
import { Player } from "./Player";

export default interface Game {
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
    guessObjects: GuessObject[];
}