export interface Player {
    username;
    isGuest: boolean;
    id?: number;
}

export interface OnlinePlayer extends Player {
    connected: boolean
}

export interface SessionPlayer extends Player {
    connected?: boolean;
}

export interface GamePlayer extends Player {
    connected: boolean;
}