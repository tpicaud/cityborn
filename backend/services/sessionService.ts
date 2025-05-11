import { PlayerService } from "./playerService";

export class SessionService {
    private playerService: PlayerService;

    constructor(playerService: PlayerService) {
        this.playerService = playerService;
    }

    async join(sessionID: string, playerID: string) {
        throw new Error("Not implemented");

    }
    async leave(sessionID: string, playerID: string) {
        throw new Error("Not implemented");

    }

    async updateGameConfig(sessionID: string, gameConfig: any, playerID: string) {
        throw new Error("Not implemented");

    }

    startGame(sessionID: string) {
        throw new Error("Not implemented");
    }
}