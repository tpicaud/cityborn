import { Server as SocketIOServer } from "socket.io";
import { disconnectPlayer, endGame, fetchGame, handleGuess, handleNextRound, joinGame, postGame, reconnect, startGame } from "./gameService.ts";
import { createAdapter } from "@socket.io/redis-adapter";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const app = express();
const server = http.createServer(app);

const playerSockets = new Map();

// Créer une instance de Socket.IO et l'attacher au serveur HTTP
export const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ['GET', 'POST'],
    }
});

// Redis instance
export const redis = new Redis(process.env.UPSTASH_REDIS_URL!);

// Redis clients (1 pub, 1 sub)
const pubClient = redis
const subClient = redis.duplicate();

//await pubClient.connect();
//await subClient.connect();

io.adapter(createAdapter(pubClient, subClient));


// Gérer les connexions WebSocket
io.on('connection', (socket) => {
    console.log('socket connected: ', socket.id);

    //////////////////////
    /// Players events ///
    //////////////////////

    // Rejoindre une partie
    socket.on('player:join', async (gameID, playerID, callback) => {
        try {
            if (!gameID || !playerID) {
                throw new Error("Paramètres invalides : gameID et playerID sont requis.");
            }
            const updatedGame = await joinGame(socket, gameID, playerID);
            playerSockets.set(socket.id, { playerID, gameID });

            console.log(`${playerID} a rejoint la game ${gameID}`);
            callback?.({ success: true, updatedGame: updatedGame });
        } catch (error) {
            console.error("Erreur lors de la tentative de rejoindre la partie :", error);
            callback?.({
                success: false,
                message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
            });
        }
    });

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

    ////////////////////
    /// Games events ///
    ////////////////////

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
            const updatedGame = await startGame(socket, gameID, playerID);
            callback?.({ success: true, updatedGame: updatedGame });
        } catch (error) {
            console.error("Erreur lors du démarrage de la partie :", error);
            callback?.({
                success: false,
                message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
            });
        }
    });


    // Enregistrer un guess
    socket.on('game:guess', async (gameID, playerID, guess, callback) => {
        try {
            const start = Date.now()
            if (!gameID || !playerID || guess === undefined) {
                throw new Error("Paramètres invalides : gameID, playerID et guess sont requis.");
            }
            const updatedGame = await handleGuess(socket, gameID, playerID, guess);
            console.log("Latency handle guess :", Date.now() - start)
            callback?.({ success: true, updatedGame: updatedGame });
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
            const updatedGame = await handleNextRound(socket, gameID, playerID);
            callback?.({ success: true, updatedGame: updatedGame });
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
            const updatedGame = await endGame(gameID, playerID);
            callback?.({ success: true, updatedGame: updatedGame });
        } catch (error) {
            console.error("Erreur lors de la fin de la partie :", error);
            callback?.({
                success: false,
                message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
            });
        }
    });

    // Événement pour déconnexion
    socket.on('disconnect', () => {
        console.log(`socket ${socket.id} déconnecté`);
        try {
            if (playerSockets.has(socket.id)) {

                const { playerID, gameID } = playerSockets.get(socket.id);

                // Déconnecter le joueur de la partie
                disconnectPlayer(socket, playerID, gameID);
                console.log(`${playerID} s'est déconnecté de la game ${gameID}`);

                // Retirer le socket du joueur
                socket.leave(gameID)
                playerSockets.delete(socket.id);
            }
        } catch (error) {
            console.error(`Erreur lors de la déconnexion de ${socket.id}`, error)
        }
    });
});

server.listen(3001, () => {
    console.log('Serveur en écoute sur le port 3001');
});