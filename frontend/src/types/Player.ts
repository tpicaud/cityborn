import { Result } from "./Results";

export interface Player {
    id: string;
    inGame: boolean;
}

export interface SessionPlayer extends Player {
    connected: boolean;
    sessionId: string;
}

export interface GamePlayer extends Player {
    connected: boolean;
}