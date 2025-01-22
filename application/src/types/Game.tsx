import { RoundStatus } from "@/enums/RoundStatus";
import GameConfig from "./GameConfig";
import Guess from "./Guess";
import GuessObject from "./GuessObject";
import Player from "./Player";
import { GameStatus } from "@/enums/GameStatus";

export default interface Game {
    id: string;
    hostID: string;
    status: GameStatus;
    config: GameConfig
    localPlayer: Player;
    players: Player[];
    guessObjects: GuessObject[];
    currentRound: {
        status: RoundStatus
        guessObject: GuessObject;
        localPlayerGuess: Guess | undefined
        remotePlayersGuesses?: Guess[];
    }
}