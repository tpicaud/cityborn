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
    localPlayer: Player;
    players: Player[];
    guessObjects: GuessObject[];
    currentRound: Round;
}