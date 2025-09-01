import { useEffect, useRef, useState } from "react";
import { useSocket } from "./useSocket";
import { IUseMultiGame } from "./IUseGame";
import { Game, GameStatus } from "@cityborn/types";
import { Guess } from "@cityborn/types";
import * as ApiServiceClient from "@/services/ApiServiceClient";
import { Socket } from "socket.io-client";
import { useError } from "@/contexts/ErrorContext";
import { ApiError } from "@cityborn/errors";

export function useMultiGame(localPlayerID: string | undefined): IUseMultiGame & {
    socket: Socket;
} {

    const { invokeError } = useError();
    const [game, setGame] = useState<Game>();
    const [connected, setConnected] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const { socket, emit, on, off } = useSocket();
    const hasTriedJoined = useRef(false);

    /////////////////
    // useEffects //
    ////////////////

    // Manage connection
    useEffect(() => {
        console.log(!!game, connected, hasTriedJoined.current)
        if (game && !connected && !hasTriedJoined.current) {
            hasTriedJoined.current = true;
            join(game.id);
        }
    }, [game]);

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
                setConnected(false)
                hasTriedJoined.current = false;

                // Fetch game
                const new_game: Game = await ApiServiceClient.fetchGame(gameID);

                // Set game
                setGame(new_game);
            } catch (error: any) {
                invokeError(error);
            }
        }

        const handleGameUpdate = (updatedGame: Game) => {
            console.log("Game update:", updatedGame);
            setGame(prev => {
                const prevGuessObjects = prev?.state?.guessObjects ?? [];

                return {
                    ...updatedGame,
                    state: {
                        ...updatedGame.state,
                        guessObjects: prevGuessObjects
                    }
                };
            });
        };


        // handle messages
        on('game:update', handleGameUpdate);
        on('game:startGame', handleStartGame);

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
            const body = { gameID };
            emit('game:join', body, (response: { success: boolean; error?: any }) => {
                if (response.success) {
                    setConnected(true);
                    resolve();
                } else {
                    reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                }
            });
        });
    }

    const guess = async (guess: Guess) => {
        if (!game) throw new Error('Joueur ou game non initialisé');

        return new Promise<void>((resolve, reject) => {
            const body = { guess };
            emit('game:guess', body, (response: { success: boolean; error?: any }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                }
            });
        });
    }

    const nextRound = async () => {
        if (!game) throw new Error('Joueur ou game non initialisé');

        return new Promise<void>((resolve, reject) => {
            emit('game:nextRound', (response: { success: boolean; error?: any }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                }
            });
        });
    }

    const end = async () => {
        setConnected(false);
        hasTriedJoined.current = false;
        setGame(undefined);
    }

    const reconnect = async (playerID: string) => {
        if (!game) throw new Error('Joueur ou game non initialisé');
        try {
            console.log('Reconnecting player to game...')
            const gameID = game.id;
            return new Promise<void>((resolve, reject) => {
                const body = { gameID, playerID };
                emit('game:reconnect', body, (response: { success: boolean; error?: any }) => {
                    if (response.success) {
                        setConnected(true);
                        resolve();
                    } else {
                        reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                    }
                });
            });
        } catch (error) {
            throw new Error(`Non connecté au serveur: ${error}`)
        }

    }

    return {
        game,
        connected,
        socket,
        isHost,
        join,
        guess,
        nextRound,
        end,
        reconnect
    };
}




