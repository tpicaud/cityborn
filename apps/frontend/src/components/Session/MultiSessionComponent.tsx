'use client';

import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import { useAuth } from '@/contexts/AuthContext';
import { useError } from '@/contexts/ErrorContext';
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
    //const multiGame = useMultiGame(localPlayerID);
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


    ///////////////////////
    // Game interactions //
    ///////////////////////

    const handleGuess = async (guess: Guess) => {
        try {
            await multiSession.guess(guess);
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleNextRound = async () => {
        try {
            await multiSession.nextRound();
        } catch (error: any) {
            invokeError(error);
        }
    }

    const handleEndGame = async () => {
        try {
            await multiSession.endGame();
        } catch (error: any) {
            //invokeError(error);
            console.log(error);
        }
    }


    ///////////////
    // Rendering //
    ///////////////

    // si pas de session, chargement
    if (!multiSession.session) return <LoadingComponent message='Chargement de la session' />

    // Si game, display game
    if (multiSession.session.currentGame) {
        return <GameComponent
            localPlayerID={localPlayerID}
            isHost={multiSession.isHost}
            mode={multiSession.session.mode}
            game={multiSession.session.currentGame}
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