import { SessionStatus } from "@/enums/SessionStatus";
import { GameConfig } from "./GameConfig";
import { Player } from "./Player";
import { GameMode } from "@/enums/GameMode";

export interface Session {
    id: string;
    hostID: string;
    mode: GameMode;
    status: SessionStatus;
    gameConfig: GameConfig;
    players: Player[];
    currentGameId?: string;
}
