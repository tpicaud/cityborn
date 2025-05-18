import { Server, Socket } from "socket.io";
import { SessionService } from "../services/sessionService";

export class SessionHandler {

    private sessionService: SessionService;

    constructor(sessionService: SessionService) {
        this.sessionService = sessionService;
    }

    register(socket: Socket, io: Server) {
        // Rejoindre une session
        socket.on('session:join', async (sessionID, playerID, callback) => {
            try {
                if (!sessionID || !playerID) throw new Error("Paramètres invalides : sessionID et playerID sont requis.");

                const session = await this.sessionService.join(socket.id, sessionID, playerID);

                await socket.join(sessionID)
                io.to(sessionID).emit('session:update', session);

                console.log(`${playerID} a rejoint la session ${sessionID}`);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors de la tentative de rejoindre la partie :", error);
                callback?.({
                    success: false,
                    message: error.message || "Une erreur inconnue s'est produite."
                });
            }
        });

        // Quitter une session
        socket.on('session:leave', async (callback) => {
            try {
                const { session, game } = await this.sessionService.leave(socket.id);

                await socket.leave(session.id);
                io.to(session.id).emit('session:update', session);

                if (game) {
                    await socket.leave(game.id);
                    io.to(game.id).emit('session:update', game);
                }

                console.log(`Le socket ${socket.id} a quitté la session ${session.id}`);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors de la tentative de quitter la partie :", error);
                callback?.({
                    success: false,
                    message: error.message || "Une erreur inconnue s'est produite."
                });
            }
        });

        socket.on('session:updateHost', async (newHostID, callback) => {
            try {
                if (!newHostID) throw new Error("Paramètres invalides : newHostID est requis.");

                const session = await this.sessionService.updateHost(socket.id, newHostID);
                io.to(session.id).emit('session:update', session);

                callback?.({ success: true });
            } catch (error) {
                console.log(error.message)
                callback?.({
                    success: false,
                    message: error.message || "Une erreur inconnue s'est produite."
                });
            }
        });

        socket.on('session:updateGameConfig', async (gameConfig, callback) => {
            try {
                if (!gameConfig) throw new Error("Paramètres invalides : gameConfig est requis.");

                const session = await this.sessionService.updateGameConfig(socket.id, gameConfig);
                io.to(session.id).emit('session:update', session);

                callback?.({ success: true });
            } catch (error) {
                console.log(error.message)
                callback?.({
                    success: false,
                    message: error.message || "Une erreur inconnue s'est produite."
                });
            }
        });

        socket.on('session:startGame', async (callback) => {
            try {
                const { session, gameID } = await this.sessionService.startGame(socket.id);

                io.to(session.id).emit('session:startGame', gameID);

                callback?.({ success: true });
            } catch (error) {
                console.log(error.message)
                callback?.({
                    success: false,
                    message: error.message || "Une erreur inconnue s'est produite."
                });
            }
        });

        socket.on('disconnect', async () => {
            try {
                const { session, game } = await this.sessionService.disconnectPlayer(socket.id);

                await socket.leave(session.id);
                io.to(session.id).emit('session:update', session);

                if (session.currentGameId) io.to(session.currentGameId).emit('game:update', game)

                console.log(`Socket ${socket.id} déconnecté`);
            } catch (error) {
                console.log(`Erreur lors de la déconnexion du socket ${socket.id}: ${error.message}`);
            }

        })
    }
}