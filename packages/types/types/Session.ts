import { SessionStatus } from "../enums/SessionStatus.js";
import { GameConfig } from "./GameConfig.js";
import { Player } from "./Player.js";
import { GameMode } from "../enums/GameMode.js";

export interface Session {
    id: string;
    hostID: string;
    mode: GameMode;
    status: SessionStatus;
    gameConfig: GameConfig;
    players: Player[];
    currentGameId?: string;
}
