import { GameConfig, Guess } from "@cityborn/types";
import { Session } from "@cityborn/types";

export interface IUseSession {
    session: Session | undefined;
    isHost: boolean;
    updateGameConfig: (gameConfig: Partial<GameConfig>) => void;

    // Game
    startGame: () => Promise<void>;
    guess: (guess: Guess) => void;
    nextRound: () => void;
    endGame: () => void;
    playAgain: () => void;
    exitGame: () => Promise<void>;
}