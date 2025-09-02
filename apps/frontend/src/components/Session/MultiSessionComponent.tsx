'use client';

import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import { useAuth } from '@/contexts/AuthContext';
import { useError } from '@/contexts/ErrorContext';
import { useMultiGame } from '@/hooks/useMultiGame';
import { useMultiSession } from '@/hooks/useMultiSession';
import { GameConfig } from '@cityborn/types';
import { Guess } from '@cityborn/types';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function MultiSessionComponent() {

    const { user } = useAuth();
    const { invokeError } = useError();
    const { sessionID } = useParams<{ sessionID: string }>();

    const [localPlayerID, setLocalPlayerID] = useState<string | undefined>(user ? user.username : undefined);

    const multiSession = useMultiSession(localPlayerID, sessionID);
    const multiGame = useMultiGame(localPlayerID);
    const hasJoinedSession = useRef(false);


    ////////////////
    // useEffects //
    ////////////////

    // Auto connect to session
    useEffect(() => {
        if (multiSession.session && localPlayerID && !multiSession.connected && !hasJoinedSession.current) {
            handleJoinSession(localPlayerID);
            hasJoinedSession.current = true;
        }
    }, [multiSession.session]);

    // Automatic reconnect
    useEffect(() => {
        const autoReconnect = async () => {
            try {
                if (localPlayerID && !multiSession.connected && multiSession.socket.connected) {
                    const { isInGame } = await multiSession.reconnect(localPlayerID);
                    if (isInGame) {
                        await multiGame.reconnect(localPlayerID);
                    }
                }
            } catch (error) {
                console.log(`Erreur lors de la reconnexion automatique: ${error}`);
            }
        }
        autoReconnect();
    }, [multiSession.connected, multiSession.socket.connected]);


    //////////////////////////
    // Session interactions //
    //////////////////////////

    const handleJoinSession = async (playerID: string) => {
        try {
            await multiSession.join(playerID);
            setLocalPlayerID(playerID);
        } catch (error: any) {
            invokeError(error);
        }
    };

    const handleUpdateHost = async (newHostID: string) => {
        try {
            await multiSession.updateHost(newHostID)
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleUpdateGameConfig = async (gameConfig: Partial<GameConfig>) => {
        try {
            await multiSession.updateGameConfig(gameConfig);
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleKickPlayer = async (playerToKick: string) => {
        try {
            await multiSession.kickPlayer(playerToKick);
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleStartGame = async () => {
        try {
            await multiSession.startGame();
        } catch (error: any) {
            invokeError(error);
        }
    }

    // const handleReconnectToSession = async () => {
    //     try {
    //         if (!localPlayerID) throw new Error('Nom du joueur non défini');
    //         const isInGame = await multiSession.reconnect(localPlayerID);
    //         if (isInGame) await multiGame.reconnect(localPlayerID);
    //     } catch (error) {
    //         console.log(`Erreur lors de la reconnexion à la session: ${error}`);
    //     }
    // };


    ///////////////////////
    // Game interactions //
    ///////////////////////

    const handleGuess = async (guess: Guess) => {
        try {
            await multiGame.guess(guess);
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleNextRound = async () => {
        try {
            await multiGame.nextRound();
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleEndGame = async () => {
        try {
            await multiSession.endGame();
            await multiGame.end();
        } catch (error: any) {
            //invokeError(error);
            console.log(error);
        }
    }

    // const handleReconnectToGame = async () => {
    //     try {
    //         if (!localPlayerID) throw new Error('Nom du joueur non défini');
    //         await multiGame.reconnect(localPlayerID);
    //     } catch (error) {
    //         console.log(`Erreur lors de la reconnexion à la partie`);
    //     }
    // };


    ///////////////
    // Rendering //
    ///////////////

    // si pas de session, chargement
    if (!multiSession.session) return <LoadingComponent message='Chargement de la session' />

    // Si game, display game
    if (multiGame.game) {
        return <GameComponent
            localPlayerID={localPlayerID}
            isHost={multiGame.isHost}
            game={multiGame.game}
            handleGuess={handleGuess}
            handleNextRound={handleNextRound}
            handleEndGame={handleEndGame}
            handlePlayAgain={handleStartGame} />
    } else {
        // display lobby
        return <LobbyComponent
            localPlayerID={localPlayerID}
            isHost={multiSession.isHost}
            session={multiSession.session}
            handleUpdateHost={handleUpdateHost}
            handleUpdateGameConfig={handleUpdateGameConfig}
            handleKickPlayer={handleKickPlayer}
            handleStartGame={handleStartGame}
            handleJoinSession={handleJoinSession} />
    }
}