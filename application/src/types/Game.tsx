import { RoundStatus } from "@/enums/RoundStatus";
import GameConfig from "./GameConfig";
import GuessObject from "./GuessObject";
import Player from "./Player";
import { GameStatus } from "@/enums/GameStatus";
import Round from "./Round";

export default interface Game {
    id: string;
    hostID: string;
    status: GameStatus;
    config: GameConfig
    players: Player[];
    guessObjects: GuessObject[];
    currentRound: Round;
}