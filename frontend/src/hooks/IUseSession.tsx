import GameConfig from "@/types/GameConfig";
import Guess from "@/types/Guess";

export default interface IUseSession {
    join: () => void;
    leave: () => void;
    updateHost: (newHostID: string) => void;
    updateGameConfig: (gameConfig: Partial<GameConfig>) => void;
    startGame: () => Promise<void>;
}