import { SessionStatus } from "@/enums/SessionStatus";
import Game from "./Game";
import GameConfig from "./GameConfig";
import Player from "./Player";
import { GameMode } from "@/enums/GameMode";

export interface Session {
    id: string;
    hostID: string;
    mode: GameMode;
    lastActivity: number;
    players: Player[];
    gameConfig: GameConfig;
    status: SessionStatus
}
