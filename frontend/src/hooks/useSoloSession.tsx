import { IUseSession } from "./IUseSession";
import { Session } from "@/types/Session";
import GameConfig from "@/types/GameConfig";
import { useEffect, useState } from "react";
import * as apiService from "@/services/apiService";
import { GameMode } from "@/enums/GameMode";

export function useSoloSession(initiateStartGame: (gameConfig: GameConfig) => Promise<void>): IUseSession {

    const [session, setSession] = useState<Session>();

    ////////////////
    // useEffects //
    ////////////////

    // Create session 
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const session: Session = await apiService.createSession(GameMode.SOLO);
                setSession(session);
            } catch (error) {
                console.log(error);
            }
        }
        fetchSession();
    }, [])


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
        } catch {
            throw new Error(`Erreur lors du lancement de la partie`)
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