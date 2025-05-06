'use client';

import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import { GameMode } from '@/enums/GameMode';
import { SessionStatus } from '@/enums/SessionStatus';
import { GameSocket, useSessionSocket } from '@/hooks/useSessionSocket';
import { useSoloSession } from '@/hooks/useSoloSession';
import Game from '@/types/Game';
import { Session } from '@/types/Session';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SoloGamePage() {

    const localPlayerID = 'guest';
    const { gameID } = useParams<{ gameID: string }>();
    const gameSocket: GameSocket = useSessionSocket(gameID, localPlayerID);
    const [session, setSession] = useState<Session>();
    const [game, setGame] = useState<Game>();

    const {
        updateGameConfig,
        startGame,
        handleGuess,
        handleNextRound,
        endGame
    } = useSoloSession(session, game, localPlayerID, setSession, setGame);

    // Fetch new session
    useEffect(() => {
        const fetchSession = async () => {
            gameSocket.joinGame(gameID, localPlayerID);
        }
        fetchSession();
    }, []);

    if (!session) {
        return <LoadingComponent message='Chargement de la partie' />
    }

    switch (session.status) {
        case SessionStatus.IN_LOBBY:
            return <LobbyComponent localPlayerID={localPlayerID} session={session} updateGameConfig={updateGameConfig} startGame={startGame} />

        case SessionStatus.IN_GAME:
            return <GameComponent localPlayerID={localPlayerID} game={game!} session={session} handleGuess={handleGuess} handleNextRound={handleNextRound} endGame={endGame} />
    }
}