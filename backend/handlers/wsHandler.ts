import { Server as SocketIOServer } from "socket.io";
import { GameService } from "../services/gameService.ts";
import { SessionService } from "../services/sessionService.ts";

export function setupWSHandler(io: SocketIOServer) {


    // Gérer les connexions WebSocket
    io.on('connection', (socket) => {
        console.log('socket connected: ', socket.id);

        //////////////////////
        /// Players events ///
        //////////////////////

        // Gestion de la reconnexion d’un joueur avant la fin du timeout
        socket.on("player:reconnect", async (gameID, playerID, callback) => {
            console.log(`Reconnexion du joueur ${playerID}...`)
            try {
                if (!gameID || !playerID) {
                    throw new Error("Paramètres invalides : gameID et playerID sont requis.");
                }

                const game = await this.playerService.reconnect(socket, gameID, playerID);

                console.log(`Reconnexion de ${playerID} réussie`)
                callback?.({ success: true, game: game });
            } catch (error) {
                console.error("Erreur lors du passage au tour suivant :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });

        // Gestion de la déconnexion du joueur
        socket.on('disconnect', () => {
            console.log(`socket ${socket.id} déconnecté`);
            try {
                if (playerSockets.has(socket.id)) {

                    const { playerID, gameID } = playerSockets.get(socket.id);

                    // Déconnecter le joueur de la partie
                    disconnectPlayer(playerID, gameID);
                    console.log(`${playerID} s'est déconnecté de la game ${gameID}`);

                    // Retirer le socket du joueur
                    socket.leave(gameID)
                    playerSockets.delete(socket.id);
                }
            } catch (error) {
                console.error(`Erreur lors de la déconnexion de ${socket.id}`, error)
            }
        });
    }
)}