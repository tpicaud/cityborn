import { Server } from "socket.io";
import http from "http";
import express from "express";
import { disconnectPlayer, handleGuess, joinGame, nextRound, postGame, startGame } from "./gameFunctions.ts";

const app = express();
const server = http.createServer(app);

const playerSockets = new Map(); // Associe socket.id à playerID

// Créer une instance de Socket.IO et l'attacher au serveur HTTP
export const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});


// Gérer les connexions WebSocket
io.on('connection', (socket) => {
    console.log(`Le client ${socket.id} est connecté`);

    // Poster une partie

    socket.on('postGame', async (game, callback) => {
        try {
            await postGame(socket, game)
            callback({ success: true })
        } catch (error) {
            callback({ success: false, message: error })
        }
    })


    // Rejoindre une partie
    socket.on('joinGame', async (gameID, playerID, callback) => {
        try {
            await joinGame(socket, gameID, playerID)
            playerSockets.set(socket.id, { playerID, gameID });  // Associer le socket au playerID
            callback({ success: true })
        } catch (error) {
            callback({ success: false, message: error })
        }
    });

    // // Lancer une partie
    socket.on('startGame', async (gameID, playerID, callback) => {
        try {
            await startGame(socket, gameID, playerID)
            callback({ success: true })
        } catch (error) {
            callback({ success: false, message: error })
        }
    });

    // // Enregistrer un guess
    socket.on('handleGuess', async (gameID, playerID, guess, callback) => {
        try {
            await handleGuess(socket, gameID, playerID, guess)
            callback({ success: true })
        } catch (error) {
            callback({ success: false, message: error })
        }
    });

    // // Aller au round suivant
    socket.on('nextRound', async (gameID, playerID, callback) => {
        try {
            await nextRound(socket, gameID, playerID)
            callback({ success: true })
        } catch (error) {
            callback({ success: false, message: error })
        }
    });

    // // Terminer la partie
    // socket.on('endGame', (gameID, playerID) => {
    //     endGame(socket, gameID, playerID)
    // })

    // Événement pour déconnexion
    socket.on('disconnect', () => {
        try {
            const { playerID, gameID } = playerSockets.get(socket.id); // Récupérer le playerID
            if (playerID) {
                disconnectPlayer(socket, playerID, gameID); // Retirer le joueur de la partie
                playerSockets.delete(socket.id); // Nettoyer la Map
            }
        } catch (error) {
            console.log('Erreur lors de la déconnexion', error)
        }
        console.log('Client déconnecté');
    });
});

server.listen(3001, () => {
    console.log('Serveur en écoute sur le port 3000');
});