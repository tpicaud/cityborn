import { IUseSession } from "./IUseSession";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "./useSocket";
import { Session } from "@cityborn/types";
import { GameConfig } from "@cityborn/types";
import * as ApiServiceClient from "@/services/ApiServiceClient";
import { Socket } from "socket.io-client";

export function useMultiSession(localPlayerID: string | undefined, sessionID: string): IUseSession & {
    // Extends interface
    connected: boolean;
    socket: Socket;
    join: (playerID: string) => void;
    updateHost: (newHostID: string) => void;
    kickPlayer: (playerToKick: string) => void;
    reconnect: (playerID: string) => Promise<{ isInGame: boolean }>;
} {

    const [session, setSession] = useState<Session>();
    const [connected, setConnected] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const { socket, emit, on, off } = useSocket();

    /////////////////
    // useEffects //
    ////////////////

    // Fetch session
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const session: Session = await ApiServiceClient.fetchSession(sessionID);
                setSession(session);
            } catch (error) {
                console.log(error);
            }
        }
        fetchSession();
    }, [])

    // Manage host
    useEffect(() => {
        if (session) {
            setIsHost(session?.hostID === localPlayerID);
        }
    }, [localPlayerID, session?.hostID])

    // Manage disconnection
    useEffect(() => {
        if (!socket?.connected) {
            setConnected(false);
        }
    }, [socket?.connected]);

    // Handle socket listener
    useEffect(() => {

        // handle events
        const handleSessionUpdate = (session: Session) => {
            console.log('Session update: ', session);
            setSession(session);
        };

        // handle messages
        on('session:update', handleSessionUpdate);

        return () => {
            // Nettoyage
            off('session:update', handleSessionUpdate);
        };
    }, [on, off]);


    ///////////////////
    // Session emits //
    ///////////////////

    const join = async (playerID: string) => {
        if (!session || !playerID) throw new Error('Joueur ou session non initialisé');

        const sessionID = session.id;
        return new Promise<void>((resolve, reject) => {
            const body = { sessionID, playerID };
            emit('session:join', body, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    setConnected(true);
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const updateHost = async (newHostID: string) => {
        if (!session) throw new Error('Joueur ou session non initialisé');

        return new Promise<void>((resolve, reject) => {
            const body = { newHostID };
            emit('session:updateHost', body, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const updateGameConfig = async (partialGameConfig: Partial<GameConfig>) => {
        if (!session) throw new Error('Joueur ou session non initialisé');

        const gameConfig = { ...session.gameConfig, ...partialGameConfig }
        const body = { gameConfig };
        return new Promise<void>((resolve, reject) => {
            emit('session:updateGameConfig', body, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    };

    const kickPlayer = async (playerToKick: string) => {
        if (!session) throw new Error('Joueur ou session non initialisé');

        const body = { playerToKick };
        return new Promise<void>((resolve, reject) => {
            emit('session:kickPlayer', body, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    };

    const startGame = async () => {
        if (!session) throw new Error('Joueur ou session non initialisé');

        return new Promise<void>((resolve, reject) => {
            emit('session:startGame', (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const endGame = async () => {
        if (!session) throw new Error('Joueur ou session non initialisé');

        if (isHost) {
            return new Promise<void>((resolve) => {
                emit('session:endGame', (response: { success: boolean; error?: string }) => {
                    if (response.success) {
                        resolve();
                    } else {
                        console.log(response.error || "Erreur inconnue");
                        resolve();
                    }
                });
            });
        }
    }

    const reconnect = async (playerID: string): Promise<{ isInGame: boolean }> => {
        if (!session || !playerID) throw new Error('Joueur ou session non initialisé');
        try {
            console.log('Reconnecting player to session...')
            const sessionID = session.id;
            return new Promise<{ isInGame: boolean }>((resolve, reject) => {
                const body = { sessionID, playerID };
                emit('session:reconnect', body, (response: { success: boolean; isInGame: boolean; error?: string }) => {
                    if (response.success) {
                        setConnected(true);
                        resolve({ isInGame: response.isInGame });
                    } else {
                        reject(new Error(response.error || "Erreur inconnue"));
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
        endGame,
        reconnect
    };
}




