"use client";

import Game from "@/types/Game";
import Guess from "@/types/Guess";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useGameSocket = (gameId: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameUpdate, setGameUpdate] = useState<Game>();
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        const socketInstance = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL); // Connexion au serveur WebSocket externe
        setSocket(socketInstance);
        setIsInitialized(true);

        socketInstance.on('updatedGame', (updatedGame) => {
            console.log('updatedGame', updatedGame);
            try {
                setGameUpdate(updatedGame)
            } catch {
                console.log('Update de game reçu non valide')
            }
        });

        return () => {
            socketInstance.off("updatedGame");
            socketInstance.disconnect(); // Nettoyage lors de la déconnexion du composant
        };
    }, [gameId]);

    // Fetch la partie
    const fetchGame = (gameID: string): Promise<Game> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('fetchGame', gameID, (response: { success: boolean, game?: Game }) => {
                console.log(response)
                if (response.success && response.game) {
                    const game = response.game
                    resolve(game);
                } else {
                    reject(new Error(`Impossible de récupérer la partie`));
                }
            });
        });
    };

    // Poster la partie sur le serveur WebSocket
    const postGame = (game: Game): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
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
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('joinGame', gameID, playerID, (response: { success: boolean, message?: string, updatedGame?: Game }) => {
                if (response.success) {
                    setGameUpdate(response.updatedGame)
                    resolve();
                } else {
                    reject(new Error(response.message || "Erreur inconnue"));
                }
            });
        });
    }

    // Démarrer la partie
    const startGame = (gameID: string, playerID: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('startGame', gameID, playerID, (response: { success: boolean, message?: string, updatedGame?: Game }) => {
                if (response.success) {
                    setGameUpdate(response.updatedGame)
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
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('handleGuess', gameID, playerID, guess, (response: { success: boolean, message?: string, updatedGame?: Game }) => {
                if (response.success) {
                    setGameUpdate(response.updatedGame)
                    resolve();
                } else {
                    reject(new Error(response.message || "Erreur inconnue"));
                }
            });
        });
    }

    // Passer au round suivant
    const handleNextRound = (gameID: string, playerID: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('handleNextRound', gameID, playerID, (response: { success: boolean, message?: string, updatedGame?: Game }) => {
                if (response.success) {
                    setGameUpdate(response.updatedGame)
                    resolve();
                } else {
                    reject(new Error(response.message || "Erreur inconnue"));
                }
            });
        });
    }

    // Terminer la partie
    const endGame = (gameID: string, playerID: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('endGame', gameID, playerID, (response: { success: boolean, message?: string, updatedGame?: Game }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.message || "Erreur inconnue"));
                }
            });
        });
    }

    return { isInitialized, gameUpdate, fetchGame, postGame, joinGame, startGame, handleGuess, handleNextRound, endGame } as GameSocket;
};

export type GameSocket = {
    isInitialized: boolean;
    gameUpdate: Game | undefined;
    fetchGame: (gameID: string) => Promise<Game>;
    postGame: (game: Game) => Promise<void>;
    joinGame: (gameID: string, playerID: string) => Promise<void>;
    startGame: (gameID: string, playerID: string) => Promise<void>;
    handleGuess: (gameID: string, playerID: string, guess: Guess) => Promise<void>;
    handleNextRound: (gameID: string, playerID: string) => Promise<void>;
    endGame: (gameID: string, playerID: string) => Promise<void>;
};

