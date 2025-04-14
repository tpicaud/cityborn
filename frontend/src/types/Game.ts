import GameConfig from "./GameConfig";
import GuessObject from "./GuessObject";
import Player from "./Player";
import { GameStatus } from "@/enums/GameStatus";
import Round from "./Round";

// export default interface Game {
//     id: string;
//     lastActivity: number;
//     mode: string
//     hostID: string;
//     status: GameStatus;
//     gameConfig: GameConfig
//     players: Player[];
//     currentRound: Round | undefined;
//     guessObjects: GuessObject[];
// }

export interface LightGame {
    id: string;
    lastActivity: number;
    mode: string
    hostID: string;
    status: GameStatus;
    gameConfig: GameConfig
    players: Player[];
    currentRound: Round | undefined;
    guessObjectsIds: string[];
}

export default interface Game extends LightGame {
    guessObjects: GuessObject[];
}