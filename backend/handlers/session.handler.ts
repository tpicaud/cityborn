import { Server, Socket } from "socket.io";
import { SessionService } from "../services/sessionService";
import { SocketService } from "../services/socketService";

export class SessionHandler {

    private socketService: SocketService;
    private sessionService: SessionService;

    constructor(socketService: SocketService, sessionService: SessionService) {
        this.socketService = socketService;
        this.sessionService = sessionService;
    }

    register(socket: Socket, io: Server) {
        // Rejoindre une session
        socket.on('session:join', async (sessionID, playerID, callback) => {
            try {
                if (!sessionID || !playerID) {
                    throw new Error("Paramètres invalides : sessionID et playerID sont requis.");
                }

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
        socket.on('session:leave', async (sessionID, playerID, callback) => {
            try {
                if (!sessionID || !playerID) {
                    throw new Error("Paramètres invalides : sessionID et playerID sont requis.");
                }

                const session = await this.sessionService.leave(sessionID, playerID);

                await socket.leave(sessionID);
                io.to(sessionID).emit('session:update', session);

                console.log(`${playerID} a rejoint la session ${sessionID}`);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors de la tentative de rejoindre la partie :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });

        socket.on('session:updateHost', async (sessionID, playerID, newHostID, callback) => {
            try {
                if (!sessionID || !playerID || !newHostID) {
                    throw new Error("Paramètres invalides : les objets sessionID, playerID et newHostID sont requis.");
                }
                const session = await this.sessionService.updateHost(sessionID, playerID, newHostID);
                io.to(sessionID).emit('session:update', session);

                callback?.({ success: true });
            } catch (error) {
                console.log(error.message)
                callback?.({ success: false });
            }
        });

        socket.on('session:updateGameConfig', async (sessionID, playerID, gameConfig, callback) => {
            try {
                if (!sessionID || !playerID || !gameConfig) {
                    throw new Error("Paramètres invalides : les objets sessionID, playerID et gameConfig sont requis.");
                }
                const session = await this.sessionService.updateGameConfig(sessionID, playerID, gameConfig);
                io.to(sessionID).emit('session:update', session);

                callback?.({ success: true });
            } catch (error) {
                console.log(error.message)
                callback?.({ success: false });
            }
        });

        socket.on('session:startGame', async (sessionID, playerID, callback) => {
            try {
                if (!sessionID || !playerID) {
                    throw new Error("Paramètres invalides : sessionID et playerID sont requis.");
                }

                const game = await this.sessionService.startGame(sessionID, playerID);

                io.to(sessionID).emit('session:startGame', game.id);

                callback?.({ success: true });
            } catch (error) {
                console.log(error.message)
                callback?.({ success: false });
            }
        });
    }
}