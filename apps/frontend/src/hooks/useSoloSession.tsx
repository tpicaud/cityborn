import { IUseSession } from "./IUseSession";
import { Session } from "@cityborn/types";
import { GameConfig } from "@cityborn/types";
import { useEffect, useState } from "react";
import * as ApiServiceClient from "@/services/ApiServiceClient";
import { GameMode } from "@cityborn/types";

export function useSoloSession(initiateStartGame: (gameConfig: GameConfig) => Promise<void>, localPlayerID: string): IUseSession {

    const [session, setSession] = useState<Session>();

    ////////////////
    // useEffects //
    ////////////////

    // Create session 
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const session: Session = await ApiServiceClient.createSession(GameMode.SOLO);
                session.hostID = localPlayerID;
                setSession(session);
            } catch (error: any) {
                console.error(error.message);
            }
        }
        fetchSession();
    }, [])

    useEffect(() => {
        console.log(session)
    }, [session])


    ///////////////////////
    // Session functions //
    ///////////////////////

    const updateGameConfig = (newConfig: Partial<GameConfig>) => {
        if (!session) return;

        setSession((prevSession) => {
            if (!prevSession) {
                throw new Error('Cannot start game because session is not initialized');
            }
            return {
                ...prevSession,
                gameConfig: { ...prevSession.gameConfig, ...newConfig }
            }
        })
    }

    const startGame = async () => {
        if (!session) return;

        try {
            await initiateStartGame(session.gameConfig);
        } catch (error) {
            throw new Error(`Erreur lors du lancement de la partie: ${error}`)
        }
    };

    const endGame = () => {
        
    }

    

    return {
        session,
        isHost: true,
        updateGameConfig,
        startGame,
        endGame
    }
}