import { IUseSession } from "./IUseSession";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "./useSocket";
import { Guess, Session, SessionStatus } from "@cityborn/types";
import { GameConfig } from "@cityborn/types";
import * as ApiServiceClient from "@/services/ApiServiceClient";
import { Socket } from "socket.io-client";
import { useError } from "@/contexts/ErrorContext";
import { ApiError } from "@cityborn/errors";

export function useMultiSession(localPlayerID: string | undefined, sessionID: string): IUseSession & {
    // Extends interface
    connected: boolean;
    socket: Socket;
    join: (playerID: string) => Promise<void>;
    updateHost: (newHostID: string) => Promise<void>;
    kickPlayer: (playerToKick: string) => Promise<void>;
    reconnect: () => void;
} {

    const { invokeError } = useError();
    const [session, setSession] = useState<Session>();
    const [connected, setConnected] = useState(false);
    const hasDisconnected = useRef<boolean>(false);
    const [isHost, setIsHost] = useState(false);
    const { socket, emit, on, off } = useSocket();

    /////////////////
    // useEffects //
    ////////////////

    // Fetch session on init
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const session: Session = await ApiServiceClient.fetchSession(sessionID);
                setSession(session);
            } catch (error: any) {
                invokeError(error)
            }
        }
        fetchSession();
    }, []);

    // Manage socket disconnection
    useEffect(() => {
        if (!socket?.connected) {
            setConnected(false);
        }
    }, [socket?.connected]);

    // Manage automatic reconnect
    useEffect(() => {
        const autoReconnect = async () => {
            try {
                if (hasDisconnected.current) {
                    await reconnect();
                }
            } catch (error: any) {
                invokeError(error);
            }
        }
        autoReconnect();
    }, [hasDisconnected]);

    // Manage host
    useEffect(() => {
        if (session) {
            setIsHost(session?.hostID === localPlayerID);
        }
    }, [localPlayerID, session?.hostID])

    // Handle socket listener
    useEffect(() => {

        // handle events
        const handleSessionUpdate = (session: Session) => {
            console.log('Session update: ', session);

            setSession((prevSession) => {
                const prevGuessObjects = prevSession?.currentGame?.state?.guessObjects;
                const newGuessObjects = session.currentGame?.state?.guessObjects;

                return {
                    ...session,
                    currentGame: session.currentGame
                        ? {
                            ...session.currentGame,
                            state: {
                                ...session.currentGame.state,
                                guessObjects: newGuessObjects ?? prevGuessObjects,
                            },
                        }
                        : undefined,
                };
            });
        };


        // handle messages
        on('session:update', handleSessionUpdate);
        on('connection_error', (error) => { console.log(error) });

        return () => {
            // Nettoyage
            off('session:update', handleSessionUpdate);
        };
    }, [on, off]);


    ///////////////////////
    // Session functions //
    ///////////////////////

    const join = async (playerID: string) => {
        if (!session || !playerID) throw new Error('Joining session failed: session of player not initialized');

        const sessionID = session.id;
        return new Promise<void>((resolve, reject) => {
            const body = { sessionID, playerID };
            emit('session:join', body, (response: { success: boolean, error?: any }) => {
                if (response.success) {
                    setConnected(true);
                    resolve();
                } else {
                    reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                }
            });
        });
    }

    const updateHost = async (newHostID: string) => {
        if (!session) throw new Error('Updating host failed: session not initialized');

        return new Promise<void>((resolve, reject) => {
            const body = { newHostID };
            emit('session:updateHost', body, (response: { success: boolean; error?: any }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                }
            });
        });
    }

    const updateGameConfig = async (partialGameConfig: Partial<GameConfig>) => {
        if (!session) throw new Error('Updating game config failed: session not initialized');

        const gameConfig = { ...session.gameConfig, ...partialGameConfig }
        const body = { gameConfig };
        return new Promise<void>((resolve, reject) => {
            emit('session:updateGameConfig', body, (response: { success: boolean; error?: any }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                }
            });
        });
    };

    const kickPlayer = async (playerToKick: string) => {
        if (!session) throw new Error('Kicking player failed: session not initialized');

        const body = { playerToKick };
        return new Promise<void>((resolve, reject) => {
            emit('session:kickPlayer', body, (response: { success: boolean; error?: any }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                }
            });
        });
    };

    ////////////////////
    // Game functions //
    ////////////////////

    const startGame = async () => {
        if (!session) throw new Error('Starting game failed: session not initialized');

        return new Promise<void>((resolve, reject) => {
            emit('session:startGame', (response: { success: boolean; error?: any }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                }
            });
        });
    }

    const guess = async (guess: Guess) => {
        if (!session || !session.currentGame) throw new Error('Guess failed: session or game not initialized');

        return new Promise<void>((resolve, reject) => {
            const body = { guess };
            emit('session:guess', body, (response: { success: boolean; error?: any }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                }
            });
        });
    }

    const nextRound = async () => {
        if (!session || !session.currentGame) throw new Error('Next round game failed: session or game not initialized');

        return new Promise<void>((resolve, reject) => {
            emit('session:nextRound', (response: { success: boolean; error?: any }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                }
            });
        });
    }

    const endGame = async () => {
        if (!session || !session.currentGame) throw new Error('Ending game failed: session or game not initialized');

        setSession({ ...session, status: SessionStatus.IN_LOBBY });
        //setSession({ ...session, currentGame: undefined });

        // if (isHost) {
        //     return new Promise<void>((resolve, reject) => {
        //         emit('session:endGame', (response: { success: boolean; error?: any }) => {
        //             if (response.success) {
        //                 resolve();
        //             } else {
        //                 reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
        //             }
        //         });
        //     });
        // }
    }

    const playAgain = async () => {
        if (!session || !session.currentGame) throw new Error('Ending game failed: session or game not initialized');

        if (isHost) {
            return new Promise<void>((resolve, reject) => {
                emit('session:playAgain', (response: { success: boolean; error?: any }) => {
                    if (response.success) {
                        resolve();
                    } else {
                        reject(new ApiError(response.error.code, response.error.message, response.error.statusCode));
                    }
                });
            });
        }
    }

    //////////////////////////
    // Connection functions //
    //////////////////////////

    const reconnect = async () => {
        if (!session || !localPlayerID) throw new Error('Reconnection failed: player or session not initialized');

        try {
            console.log('Reconnecting player to session...')
            const sessionID = session.id;
            return new Promise<{ isInGame: boolean }>((resolve, reject) => {
                const body = { sessionID, localPlayerID };
                emit('session:reconnect', body, (response: { success: boolean; isInGame: boolean; error?: any }) => {
                    if (response.success) {
                        setConnected(true);
                        hasDisconnected.current = false;
                        resolve({ isInGame: response.isInGame });
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
        session,
        connected,
        socket,
        isHost,
        join,
        updateHost,
        updateGameConfig,
        kickPlayer,
        startGame,
        guess,
        nextRound,
        endGame,
        playAgain,
        reconnect
    };
}




