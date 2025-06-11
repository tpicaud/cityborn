import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";
import { IUseMultiGame } from "./IUseGame";
import Game from "@/types/Game";
import Guess from "@/types/Guess";
import * as apiService from "@/services/apiService";

export function useMultiGame(localPlayerID: string | undefined): IUseMultiGame {

    const [game, setGame] = useState<Game>();
    const [connected, setConnected] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const { socket, emit, on, off } = useSocket();

    /////////////////
    // useEffects //
    ////////////////

    // Manage disconnection
    useEffect(() => {
        if (!socket?.connected) {
            setConnected(false);
        }
    }, [socket?.connected]);

    // Manage host
    useEffect(() => {
        if (game) {
            setIsHost(game?.hostID === localPlayerID);
        }
    }, [localPlayerID, game?.hostID])


    // Handle socket listener
    useEffect(() => {

        // handle events
        const handleStartGame = async (gameID: string) => {
            try {
                const game: Game = await apiService.fetchGame(gameID);
                setGame(game);
                await join(gameID);
            } catch (error) {
                console.log(`Erreur lors de la connexion à la partie: ${error}`);
            }
        }

        const handleGameUpdate = (game: Game) => {
            console.log("Game updated:", game);
            setGame(prev => {
                const prevGuessObjects = prev?.state?.guessObjects ?? [];

                return {
                    ...game,
                    state: {
                        ...game.state,
                        guessObjects: prevGuessObjects
                    }
                };
            });
        };


        // handle messages
        on('game:update', handleGameUpdate);
        on('game:startGame', handleStartGame)

        return () => {
            // Nettoyage
            off('game:update', handleGameUpdate);
            off('game:startGame', handleStartGame);
        };
    }, [on, off]);


    ////////////////
    // Game emits //
    ////////////////

    const join = async (gameID: string) => {
        return new Promise<void>((resolve, reject) => {
            emit('game:join', gameID, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    setConnected(true);
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const guess = async (guess: Guess) => {
        if (!game) throw new Error('Joueur ou game non initialisé');

        return new Promise<void>((resolve, reject) => {
            emit('game:guess', guess, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const nextRound = async () => {
        if (!game) throw new Error('Joueur ou game non initialisé');

        return new Promise<void>((resolve, reject) => {
            emit('game:nextRound', (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const end = async () => {
        if (!game) throw new Error('Joueur ou game non initialisé');
        setGame(undefined);
    }

    const reconnect = async (playerID: string) => {
        if (!game) throw new Error('Joueur ou game non initialisé');
        try {
            // Wait for socket to reconnect to server
            await waitForConnection(() => connected, 10000);

            // Reconnect to game
            const gameID = game.id;
            return new Promise<void>((resolve, reject) => {
                emit('game:reconnect', gameID, playerID, (response: { success: boolean; error?: string }) => {
                    if (response.success) {
                        setConnected(true);
                        resolve();
                    } else {
                        reject(new Error(response.error || "Erreur inconnue"));
                    }
                });
            });
        } catch (error) {
            throw new Error(`Non connecté au serveur: ${error}`)
        }

    }


    // Utils functions
    function waitForConnection(checkFn: () => boolean, timeout = 5000, interval = 100): Promise<void> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const check = () => {
                if (checkFn()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error("Connexion socket non établie dans le temps imparti"));
                } else {
                    setTimeout(check, interval);
                }
            };

            check();
        });
    };

    return {
        game,
        connected,
        isHost,
        join,
        guess,
        nextRound,
        end,
        reconnect
    };
}




