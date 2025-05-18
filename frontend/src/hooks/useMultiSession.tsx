import IUseSession from "./IUseSession";
import Guess from "@/types/Guess";
import { useState } from "react";
import Game from "@/types/Game";
import { useSocket } from "./useSocket";
import { Session } from "@/types/Session";
import GameConfig from "@/types/GameConfig";

export function useMultiSession(
    localPlayerID: string | undefined,
): IUseSession {

    const [session, setSession] = useState<Session>();
    const { connected, emit, on, off, socket } = useSocket();


    ///////////////////////
    // Session functions //
    ///////////////////////
    const join = async () => {
        if (!session || !localPlayerID) throw new Error('Joueur ou session non initialisé');

        const playerID = localPlayerID;
        const sessionID = session?.id;
        return new Promise<void>((resolve, reject) => {
            emit('session:join', sessionID, playerID, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const leave = async () => {
        if (!session || !localPlayerID) throw new Error('Joueur ou session non initialisé');

        return new Promise<void>((resolve, reject) => {
            emit('session:leave', (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    }

    const updateHost = async (newHostID: string) => {
        if (!session || !localPlayerID) throw new Error('Joueur ou session non initialisé');

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
        if (!session || !localPlayerID) throw new Error('Joueur ou session non initialisé');

        return new Promise<void>((resolve, reject) => {
            emit('session:updateGameConfig', [localPlayerID, gameConfig], (response: { success: boolean; error?: string }) => {
                if (response.success) {
                    resolve();
                } else {
                    reject(new Error(response.error || "Erreur inconnue"));
                }
            });
        });
    };


    const startGame = async () => {
        if (!session || !localPlayerID) throw new Error('Joueur ou session non initialisé');

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

    return {
        join,
        leave,
        updateHost,
        updateGameConfig,
        startGame
    };
}




