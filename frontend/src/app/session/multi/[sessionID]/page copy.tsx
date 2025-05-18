'use client';

import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import { DialogInput } from '@/components/others/DialogInput';
import LoadingComponent from '@/components/others/LoadingComponent';
import { SessionStatus } from '@/enums/SessionStatus';
import { useMultiSession } from '@/hooks/useMultiSession';
import { SessionSocket, useSessionSocket } from '@/hooks/useSessionSocket';
import { Session } from '@/types/Session';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MultiSessionPage() {

    const [localPlayerID, setLocalPlayerID] = useState<string>();
    const [session, setSession] = useState<Session>();
    const { sessionID } = useParams<{ sessionID: string }>();
    const sessionSocket: SessionSocket = useSessionSocket(sessionID, localPlayerID);

    // Fetch new session
    useEffect(() => {
        const fetchSession = async () => {
            if (localPlayerID && sessionSocket.isConnected) {
                await sessionSocket.joinSession(sessionID, localPlayerID);
            }
        }
        fetchSession();
    }, [localPlayerID, sessionSocket.isConnected]);

    const {
        updateGameConfig,
        startGame,
        handleGuess,
        handleNextRound,
        endGame
    } = useMultiSession(sessionSocket, localPlayerID, session, setSession);

    const handleJoin = (input: string) => {
        if (session && !session.players.some(player => player.id === input)) {
            setLocalPlayerID(input);
        }
    };

    if (!localPlayerID) {
        return (
            <div className="flex flex-row justify-center items-center mt-16">
                <DialogInput message='Entrez votre pseudo' handleClick={handleJoin} label='Votre pseudo' />
            </div>
        );
    }

    if (!session) {
        return <LoadingComponent message='Chargement de la partie' />
    }

    switch (session.status) {
        case SessionStatus.IN_LOBBY:
            return <LobbyComponent localPlayerID={localPlayerID} session={session} updateGameConfig={updateGameConfig} startGame={startGame} />

        case SessionStatus.IN_GAME:
            return <GameComponent localPlayerID={localPlayerID} game={session.currentGame!} session={session} handleGuess={handleGuess} handleNextRound={handleNextRound} endGame={endGame} />
    }
}