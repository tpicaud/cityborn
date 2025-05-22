import GameConfig from "@/types/GameConfig";
import { Session } from "@/types/Session";

export interface IUseSession {
    session: Session | undefined;
    isHost: boolean;
    updateGameConfig: (gameConfig: Partial<GameConfig>) => void;
    startGame: () => Promise<void>;
}

export interface IUseMultiSession extends IUseSession {
    connected: boolean;
    join: (playerID: string) => void;
    updateHost: (newHostID: string) => void;
    kickPlayer: (playerToKick: string) => void;
    reconnect: (playerID: string) => Promise<{ isInGame: boolean }>;
}