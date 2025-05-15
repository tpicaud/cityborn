import { Server, Socket } from "socket.io";
import { GameService } from "../services/gameService";

export class GameHandler {
    private gameService: GameService;

    constructor(gameService: GameService) {
        this.gameService = gameService;
    }

    register(socket: Socket, io: Server) {
        // Enregistrer un guess
        socket.on('game:guess', async (gameID, playerID, guess, callback) => {
            try {
                const start = Date.now()
                if (!gameID || !playerID || guess === undefined) {
                    throw new Error("Paramètres invalides : gameID, playerID et guess sont requis.");
                }
                await this.gameService.handleGuess(gameID, playerID, guess);
                console.log("Latency handle guess :", Date.now() - start)
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors du traitement du guess :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });


        // Aller au round suivant
        socket.on('game:nextRound', async (gameID, playerID, callback) => {
            try {
                if (!gameID || !playerID) {
                    throw new Error("Paramètres invalides : gameID et playerID sont requis.");
                }
                const updatedGame = await this.gameService.handleNextRound(gameID, playerID);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors du passage au tour suivant :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });
    }
}