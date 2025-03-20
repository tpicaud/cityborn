import GameConfig from "./GameConfig";
import GuessObject from "./GuessObject";
import Player from "./Player";
import { GameStatus } from "@/enums/GameStatus";
import Round from "./Round";

export default interface Game {
    id: string;
    mode: string
    hostID: string;
    status: GameStatus;
    gameConfig: GameConfig
    players: Player[];
    currentRound: Round | undefined;
    guessObjects: GuessObject[];
}