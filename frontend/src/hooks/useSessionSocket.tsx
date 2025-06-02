"use client";

import Game from "@/types/Game";
import Guess from "@/types/Guess";
import { Session } from "@/types/Session";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSessionSocket = (gameId: string, localPlayerID: string | undefined) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameUpdate, setGameUpdate] = useState<Game>();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {

        if (isConnected) return;

        const reconnectInterval = setInterval(() => {
            const newSocket = connectSocket();

            // Cleanup du timeout en cas de démontage du composant ou de reconnexion réussie
            return () => {
                clearInterval(reconnectInterval);
                newSocket.off("updatedGame");
                newSocket.off("connect");
                newSocket.off("disconnect");
                newSocket.disconnect();
            }
        }, 2000); // Attendre 3 secondes avant de réessayer

        return () => {
            clearInterval(reconnectInterval); // S'assurer de nettoyer l'intervalle
        };
    }, [isConnected]);

    // Reconnexion à la partie à chaque nouveau socket
    useEffect(() => {
        if (localPlayerID && isConnected) {
            try {
                console.log('🔄 Tentative de reconnexion à la partie')
                reconnectToGame()
            } catch (error) {
                throw new Error(`Erreur lors de la reconnexion à la partie: ${error}`)
            }
        }
    }, [socket])

    // Fonction de connexion socket
    const connectSocket = () => {
        const newSocket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL, {
            transports: ['websocket'],
            reconnection: false,
        });


        newSocket.on("connect", () => {
            console.log("Socket connecté au serveur !");
            setIsConnected(true);
            setSocket(newSocket);
        });

        newSocket.on("disconnect", () => {
            console.log("Socket déconnecté !");
            setIsConnected(false);
        });

        newSocket.on("game:update", (game) => {
            try {
                setGameUpdate(game);
            } catch {
                console.log("Update de game reçu non valide");
            }
        });

        return newSocket;
    };

    //////////////////////
    /// Players events ///
    //////////////////////

    // Rejoindre la partie
    const joinSession = (gameID: string, playerID: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('player:join', gameID, playerID, (response: { success: boolean, message?: string, updatedGame?: Game }) => {
                if (response.success) {
                    setGameUpdate(response.updatedGame)
                    resolve();
                } else {
                    reject(new Error(response.message || "Erreur inconnue"));
                }
            });
        });
    }

    // Fetch la partie
    const reconnectToGame = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }

            const playerID = localPlayerID;
            const gameID = gameId;
            socket.emit('player:reconnect', gameID, playerID, (response: { success: boolean, game?: Game }) => {
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

    ////////////////////
    /// Games events ///
    ////////////////////

    // Fetch la partie
    const fetchGame = (gameID: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }

            const fetchGuessObjects = async (guessObjectsIds: string[]) => {
                const response = await fetch('/api/guess-objects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ guessObjectsIds }),
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la création de la partie');
                }

                return await response.json();
            }

            socket.emit('game:fetch', gameID, async (response: { success: boolean, game?: Game }) => {
                console.log(response)
                if (response.success && response.game) {
                    const game = response.game;
                    const guessObjects = await fetchGuessObjects(response.game.guessObjectsIds)
                    setGameUpdate({ ...game, guessObjects: guessObjects })
                    resolve();
                } else {
                    reject(new Error(`Impossible de récupérer la partie`));
                }
            });
        });
    };

    // Poster la partie sur le serveur WebSocket
    const postGame = (fullGame: Game): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }
            // Separate guess objects from game
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { guessObjects: _, ...game } = fullGame;


            socket.emit('game:post', game, (response: { success: boolean, message?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.message || "Erreur inconnue"));
                }
            });
        });
    };

    // Démarrer la partie
    const startGame = (gameID: string, playerID: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error("Socket non initialisée"));
                return;
            }

            socket.emit('game:start', gameID, playerID, (response: { success: boolean, message?: string, updatedGame?: Game }) => {
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
                reject(new Error("Socket non initialisée"));
                return;
            }

            const start = Date.now()
            console.log("Sending guess:", start)
            socket.emit('game:guess', gameID, playerID, guess, (response: { success: boolean, message?: string, updatedGame?: Game }) => {
                if (response.success) {
                    console.log("Latency: ", Date.now() - start)
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

            socket.emit('game:nextRound', gameID, playerID, (response: { success: boolean, message?: string, updatedGame?: Game }) => {
                if (response.success) {
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

            socket.emit('game:end', gameID, playerID, (response: { success: boolean, message?: string, updatedGame?: Game }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.message || "Erreur inconnue"));
                }
            });
        });
    }

    return { isConnected, sessionUpdate, fetchSession, joinSession, postGame, startGame, handleGuess, handleNextRound, endGame } as SessionSocket;
};

export type SessionSocket = {
    isConnected: boolean;
    sessionUpdate: Session | undefined;
    fetchSession: (sessionID: string) => Promise<void>;
    joinSession: (sessionID: string, playerID: string) => Promise<void>;
    postGame: (game: Game) => Promise<void>;
    startGame: (sessionID: string, playerID: string, game: Game) => Promise<void>;
    handleGuess: (sessionID: string, playerID: string, guess: Guess) => Promise<void>;
    handleNextRound: (gameID: string, playerID: string) => Promise<void>;
    endGame: (gameID: string, playerID: string) => Promise<void>;
};

