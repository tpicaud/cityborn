"use client";

import Game from "@/types/Game";
import Guess from "@/types/Guess";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useGameSocket = (gameId: string, localPlayerID: string | null) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameUpdate, setGameUpdate] = useState<Game>();
    const [isConnected, setIsConnected] = useState(false);
    //const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL, {
            transports: ['websocket'],
            reconnection: false
        });

        setSocket(newSocket)

        newSocket.on("connect", async () => {

            console.log("Socket connected!");
            setIsConnected(true);

            if (newSocket.recovered) {
                console.log(`Socket ${newSocket.id} has recovered !`);
            }
        });

        newSocket.on("disconnect", () => {
            console.log("Socket disconnected!");
            setIsConnected(false); // L'utilisateur est déconnecté
        });

        newSocket.on("updatedGame", (updatedGame) => {
            console.log("updatedGame", updatedGame);
            try {
                setGameUpdate(updatedGame);
            } catch {
                console.log("Update de game reçu non valide");
            }
        });

        // Fonction pour essayer de reconnecter le socket si la page redevient visible
        const handleVisibilityChange = async () => {
            if (document.visibilityState === "visible" && !newSocket.connected) {
                console.log("Page visible, tentative de reconnexion...");
                newSocket.connect();
                // newSocket.once("connect", async () => {
                //     console.log('Socket reconnecté, tentative de reconnexion à la partie')
                //     try {
                //         await reconnectToGame();
                //     } catch (error) {
                //         throw new Error(`Erreur lors de la reconnexion à la partie: ${error}`)
                //     }
                // })
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            newSocket.off("updatedGame");
            newSocket.off("connect");
            newSocket.off("disconnect");
            newSocket.disconnect();
        };
    }, [gameId]);

    useEffect(() => {
        if (localPlayerID) {
            try {
                reconnectToGame()
            } catch (error) {
                throw new Error(`Erreur lors de la reconnexion à la partie: ${error}`)
            }
        }
    }, [socket])

    // Fetch la partie
    const reconnectToGame = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }

            const playerID = localPlayerID;
            const gameID = gameId;
            socket.emit('reconnect_player', gameID, playerID, (response: { success: boolean, game?: Game }) => {
                console.log(response)
                if (response.success && response.game) {
                    setGameUpdate(response.game)
                    resolve();
                } else {
                    reject(new Error(`Impossible de récupérer la partie`));
                }
            });
        });
    };

    // Fetch la partie
    const fetchGame = (gameID: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('fetchGame', gameID, (response: { success: boolean, game?: Game }) => {
                console.log(response)
                if (response.success && response.game) {
                    setGameUpdate(response.game)
                    resolve();
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

    return { isConnected, gameUpdate, fetchGame, postGame, joinGame, startGame, handleGuess, handleNextRound, endGame } as GameSocket;
};

export type GameSocket = {
    isConnected: boolean;
    gameUpdate: Game | undefined;
    fetchGame: (gameID: string) => Promise<void>;
    postGame: (game: Game) => Promise<void>;
    joinGame: (gameID: string, playerID: string) => Promise<void>;
    startGame: (gameID: string, playerID: string) => Promise<void>;
    handleGuess: (gameID: string, playerID: string, guess: Guess) => Promise<void>;
    handleNextRound: (gameID: string, playerID: string) => Promise<void>;
    endGame: (gameID: string, playerID: string) => Promise<void>;
};

