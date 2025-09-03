import { SessionStatus } from "../enums/SessionStatus.js";
import { GameConfig } from "./GameConfig.js";
import { Player } from "./Player.js";
import { Game } from "./Game.js";
import { SessionMode } from "../enums/SessionMode.js";

export interface Session {
    id: string;
    hostID: string;
    mode: SessionMode;
    status: SessionStatus;
    gameConfig: GameConfig;
    players: Player[];

    // Game
    currentGame?: Game;
}
