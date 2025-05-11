import { Server as SocketIOServer } from "socket.io";
import { GameService } from "../services/gameService";
import { PlayerService } from "../services/playerService";
import { SessionService } from "../services/sessionService";

export function setupSessionSocket(io: SocketIOServer) {

    const playerService = new PlayerService();
    const sessionService = new SessionService(playerService);
    const gameService = new GameService(playerService);

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

                const game = await reconnect(socket, gameID, playerID);
                playerSockets.set(socket.id, { playerID, gameID });

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


        /////////////////////
        /// Session events //
        /////////////////////

        // Rejoindre une partie
        socket.on('session:join', async (sessionID, playerID, callback) => {
            try {
                if (!sessionID || !playerID) {
                    throw new Error("Paramètres invalides : gameID et playerID sont requis.");
                }
                const updatedGame = await joinGame(socket, sessionID, playerID);
                playerSockets.set(socket.id, { playerID, sessionID });

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

        socket.on('session:updateGameConfig', async (gameID, playerID, gameConfig, callback) => {
            try {
                if (!gameID) {
                    throw new Error("Paramètre invalide : un objet 'gameID' est requis.");
                }
                const game = await updateGameConfig(sessionID, gameConfig);
                callback?.({ success: true });
            } catch (error) {
                console.log(error.message)
                callback?.({ success: false });
            }
        });

        socket.on('session:startGame', async (sessionID, playerID, callback) => {
            try {
                if (!sessionID) {
                    throw new Error("Paramètre invalide : un objet 'gameID' est requis.");
                }
                const game = await startGame(sessionID, playerID);
                callback?.({ success: true });
            } catch (error) {
                console.log(error.message)
                callback?.({ success: false });
            }
        });



        ////////////////////
        /// Games events ///
        ////////////////////

        // Enregistrer un guess
        socket.on('game:guess', async (gameID, playerID, guess, callback) => {
            try {
                const start = Date.now()
                if (!gameID || !playerID || guess === undefined) {
                    throw new Error("Paramètres invalides : gameID, playerID et guess sont requis.");
                }
                await handleGuess(gameID, playerID, guess);
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
                const updatedGame = await handleNextRound(gameID, playerID);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors du passage au tour suivant :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });


        ////////////////////////////////////////
        // To verify and delete
        ////////////////////////////////////////

        // Récupérer une partie
        socket.on('game:fetch', async (gameID, callback) => {
            try {
                if (!gameID) {
                    throw new Error("Paramètre invalide : un objet 'gameID' est requis.");
                }
                const game = await fetchGame(gameID);
                callback?.({ success: true, game: game });
            } catch (error) {
                console.log(error.message)
                callback?.({ success: false });
            }
        });

        // Poster une partie
        socket.on('game:post', async (game, callback) => {
            try {
                if (!game || typeof game !== 'object') {
                    throw new Error("Paramètre invalide : un objet 'game' est requis.");
                }
                await postGame(game);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors de l'enregistrement du jeu :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });

        // Lancer une partie
        socket.on('game:start', async (gameID, playerID, callback) => {
            try {
                if (!gameID || !playerID) {
                    throw new Error("Paramètres invalides : gameID et playerID sont requis.");
                }
                const updatedGame = await startGame(gameID, playerID);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors du démarrage de la partie :", error);
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
                const updatedGame = await endGame(gameID, playerID);
                callback?.({ success: true });
            } catch (error) {
                console.error("Erreur lors de la fin de la partie :", error);
                callback?.({
                    success: false,
                    message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
                });
            }
        });
    });
}