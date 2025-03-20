import { Server } from "socket.io";
import http from "http";
import express from "express";
import { disconnectPlayer, endGame, handleGuess, handleNextRound, joinGame, postGame, startGame } from "./gameFunctions.ts";
import { getGame } from "./gamesStore.ts";

const app = express();
const server = http.createServer(app);

const playerSockets = new Map();

// Créer une instance de Socket.IO et l'attacher au serveur HTTP
export const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});


// Gérer les connexions WebSocket
io.on('connection', (socket) => {

    // Récupérer une partie
    socket.on('fetchGame', async (gameID, callback) => {
        try {
            if (!gameID) {
                throw new Error("Paramètre invalide : un objet 'gameID' est requis.");
            }
            const game = getGame(gameID);
            if (!game) {
                throw new Error("Partie introuvable")
            }
            callback?.({ success: true, game: game });
        } catch (error) {
            callback?.({ success: false });
        }
    });

    // Poster une partie
    socket.on('postGame', async (game, callback) => {
        try {
            if (!game || typeof game !== 'object') {
                throw new Error("Paramètre invalide : un objet 'game' est requis.");
            }
            await postGame(socket, game);
            callback?.({ success: true });
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du jeu :", error);
            callback?.({
                success: false,
                message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
            });
        }
    });



    // Rejoindre une partie
    socket.on('joinGame', async (gameID, playerID, callback) => {
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


    // Lancer une partie
    socket.on('startGame', async (gameID, playerID, callback) => {
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
    socket.on('handleGuess', async (gameID, playerID, guess, callback) => {
        try {
            if (!gameID || !playerID || guess === undefined) {
                throw new Error("Paramètres invalides : gameID, playerID et guess sont requis.");
            }
            const updatedGame = await handleGuess(socket, gameID, playerID, guess);
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
    socket.on('handleNextRound', async (gameID, playerID, callback) => {
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
    socket.on('endGame', async (gameID, playerID, callback) => {
        try {
            if (!gameID || !playerID) {
                throw new Error("Paramètres invalides : gameID et playerID sont requis.");
            }
            const updatedGame = await endGame(socket, gameID, playerID);
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
        try {
            if (playerSockets.has(socket.id)) {
                const { playerID, gameID } = playerSockets.get(socket.id);
                disconnectPlayer(socket, playerID, gameID); // Retirer le joueur de la partie

                playerSockets.delete(socket.id);
                console.log(`${playerID} s'est déconnecté de la game ${gameID}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la déconnexion de ${socket.id}`, error)
        }
        console.log(`Client ${socket.id} déconnecté`);
    });
});

server.listen(3001, () => {
    console.log('Serveur en écoute sur le port 3001');
});