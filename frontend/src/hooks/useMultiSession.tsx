import { IUseMultiSession } from "./IUseSession";
import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";
import { Session } from "@/types/Session";
import GameConfig from "@/types/GameConfig";
import * as apiService from "@/services/apiService";

export function useMultiSession(localPlayerID: string | undefined, sessionID: string): IUseMultiSession {

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
                const session: Session = await apiService.fetchSession(sessionID);
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
            emit('session:join', sessionID, playerID, (response: { success: boolean; error?: string }) => {
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
            emit('session:updateHost', newHostID, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const updateGameConfig = async (gameConfig: Partial<GameConfig>) => {
        if (!session) throw new Error('Joueur ou session non initialisé');

        return new Promise<void>((resolve, reject) => {
            emit('session:updateGameConfig', [gameConfig], (response: { success: boolean; error?: string }) => {
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

        return new Promise<void>((resolve, reject) => {
            emit('session:kickPlayer', [playerToKick], (response: { success: boolean; error?: string }) => {
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

    const reconnect = async (playerID: string): Promise<{ isInGame: boolean }> => {
        if (!session || !playerID) throw new Error('Joueur ou session non initialisé');
        try {
            // Wait for socket to reconnect to server
            await waitForConnection(() => connected, 10000);

            // Reconnect to session
            const sessionID = session.id;
            return new Promise<{ isInGame: boolean }>((resolve, reject) => {
                emit('session:reconnect', sessionID, playerID, (response: { success: boolean; isInGame: boolean; error?: string }) => {
                    if (response.success) {
                        setConnected(true);
                        resolve({ isInGame: response.isInGame });
                    } else {
                        reject(new Error(response.error || "Erreur inconnue"));
                    }
                });
            });
        } catch (error) {
            throw new Error(`Non connecté au serveur`)
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
        session,
        connected,
        isHost,
        join,
        updateHost,
        updateGameConfig,
        kickPlayer,
        startGame,
        reconnect
    };
}




