export interface Player {
    id: string;
    inGame: boolean;
}

export interface SessionPlayer extends Player {
    connected: boolean;
    sessionID: string;
}

export interface GamePlayer extends Player {
    connected: boolean;
}