import GameConfig from "@/types/GameConfig";
import { Session } from "@/types/Session";

export interface IUseSession {
    session: Session | undefined;
    isHost: boolean;
    updateGameConfig: (gameConfig: Partial<GameConfig>) => void;
    startGame: () => void;
    endGame:() => void
}