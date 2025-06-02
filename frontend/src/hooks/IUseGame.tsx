import Game from "@/types/Game";
import Guess from "@/types/Guess";

export interface IUseGame {
    game: Game | undefined;
    isHost: boolean;
    guess: (guess: Guess) => void;
    nextRound: () => void;
    end: () => void;
}

export interface IUseMultiGame extends IUseGame {
    connected: boolean;
    join: (gameID: string) => void;
    reconnect: (playerID: string) => void;
}