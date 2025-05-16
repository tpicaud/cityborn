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
                
                const updatedGame = await this.gameService.join(gameID, playerID);

                await socket.join(gameID)
                io.to(gameID).emit('game:update', updatedGame);

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

        // Leave game
        socket.on('game:leave', async (gameID, playerID, callback) => {
            try {
                if (!gameID || !playerID) {
                    throw new Error("Paramètres invalides : gameID et playerID sont requis.");
                }

                const updatedGame = await this.gameService.leave(gameID, playerID);

                await socket.leave(gameID);
                io.to(gameID).emit('game:update', updatedGame);

                console.log(`${playerID} a rejoint la game ${gameID}`);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors de la tentative de rejoindre la partie :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });


        // Enregistrer un guess
        socket.on('game:guess', async (gameID, playerID, guess, callback) => {
            try {
                if (!gameID || !playerID || guess === undefined) {
                    throw new Error("Paramètres invalides : gameID, playerID et guess sont requis.");
                }

                const updatedGame = await this.gameService.handleGuess(gameID, playerID, guess);

                io.to(gameID).emit('game:update', updatedGame);
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

                io.to(gameID).emit('game:update', updatedGame);
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
        socket.on('game:end', async (gameID, playerID, callback) => {
            try {
                if (!gameID || !playerID) {
                    throw new Error("Paramètres invalides : gameID et playerID sont requis.");
                }
                
                await this.gameService.endGame(gameID, playerID);
                
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