export interface Player {
  username: string;
  isGuest: boolean;
  id?: string;
}

export interface OnlinePlayer extends Player {
  connected: boolean;
}

export interface SessionPlayer extends Player {
  connected?: boolean;
}

export interface GamePlayer extends Player {
  connected: boolean;
}
