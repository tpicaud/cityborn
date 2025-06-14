import { GameConfig } from "@cityborn/types";
import { Session } from "@cityborn/types";

export interface IUseSession {
    session: Session | undefined;
    isHost: boolean;
    updateGameConfig: (gameConfig: Partial<GameConfig>) => void;
    startGame: () => void;
    endGame:() => void
}