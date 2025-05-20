import { Server, Socket } from "socket.io";
import { GameService } from "../services/gameService";

export class GameHandler {
    private gameService: GameService;

    constructor(gameService: GameService) {
        this.gameService = gameService;
    }

    register(socket: Socket, io: Server) {

        // Join game
        socket.on('game:join', async (gameID, playerID, callback) => {
            try {
                if (!gameID || !playerID === undefined) {
                    throw new Error("Paramètres invalides : gameID, playerID et guess sont requis.");
                }
                
                const game = await this.gameService.join(gameID, playerID);

                await socket.join(gameID)
                io.to(game.id).emit('game:update', game);

                console.log(`${playerID} a rejoint la session ${gameID}`);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors du traitement du guess :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });

        // Enregistrer un guess
        socket.on('game:guess', async (guess, callback) => {
            try {
                if (!guess) {
                    throw new Error("Paramètres invalides : guess est requis.");
                }

                const game = await this.gameService.handleGuess(socket.id, guess);

                io.to(game.id).emit('game:update', game);
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
        socket.on('game:nextRound', async (callback) => {
            try {
                const game = await this.gameService.handleNextRound(socket.id);

                io.to(game.id).emit('game:update', game);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors du passage au tour suivant :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });

        // Terminer la partie
        socket.on('game:end', async (callback) => {
            try {
                await this.gameService.endGame(socket.id);
                
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors de la fin de la partie :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });
    }
}