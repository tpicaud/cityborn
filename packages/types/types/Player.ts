export interface Player {
    id: string;
    isGuest: boolean
}

export interface OnlinePlayer extends Player{
    connected: boolean
}

export interface SessionPlayer extends Player {
    connected?: boolean;
}

export interface GamePlayer extends Player {
    connected: boolean;
}