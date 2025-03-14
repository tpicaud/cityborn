"use client";

import Game from "@/types/Game";
import Guess from "@/types/Guess";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (gameId: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameUpdate, setGameUpdate] = useState<Game>()

    useEffect(() => {
        const socketInstance = io("http://localhost:3001"); // Connexion au serveur WebSocket externe
        setSocket(socketInstance);

        socketInstance.on('error', (message: string) => {
            console.log('error', message);
        });

        socketInstance.on('updatedGame', (updatedGame) => {
            console.log('updatedGame', updatedGame);
            try {
                updatedGame as Game
                setGameUpdate(updatedGame)
            } catch {
                console.log('Update de game reçu non valide')
            }
        });

        return () => {
            socketInstance.off("updatedGame");
            socketInstance.off("error");
            socketInstance.disconnect(); // Nettoyage lors de la déconnexion du composant
        };
    }, [gameId]);

    // Poster la partie sur le serveur WebSocket
    const postGame = (game: Game): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                console.log('Socket pas initialisé');
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('postGame', game, (response: { success: boolean, message?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.message || "Erreur inconnue"));
                }
            });
        });
    };

    // Rejoindre la partie
    const joinGame = (gameID: string, playerID: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                console.log('Socket pas initialisé');
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('joinGame', gameID, playerID, (response: { success: boolean, message?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.message || "Erreur inconnue"));
                }
            });
        });
    }

    // Envoyer un guess
    const handleGuess = (gameID: string, playerID: string, guess: Guess): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                console.log('Socket pas initialisé');
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('handleGuess', gameID, playerID, guess, (response: { success: boolean, message?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.message || "Erreur inconnue"));
                }
            });
        });
    }

    return { gameUpdate, postGame, joinGame, handleGuess };
};
