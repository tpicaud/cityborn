export interface Player {
    id: string;
}

export interface SessionPlayer extends Player {
    connected: boolean;
    sessionID: string;
}

export interface GamePlayer extends Player {
    connected: boolean;
}