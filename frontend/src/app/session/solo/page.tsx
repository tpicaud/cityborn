'use client';

import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import { GameMode } from '@/enums/GameMode';
import { SessionStatus } from '@/enums/SessionStatus';
import { useSoloSession } from '@/hooks/useSoloSession';
import Game from '@/types/Game';
import { Session } from '@/types/Session';
import { useEffect, useState } from 'react';

export default function SoloGamePage() {

    const localPlayerID = 'guest';
    const [session, setSession] = useState<Session>();
    const [game, setGame] = useState<Game>();

    const {
        updateConfig,
        startGame,
        handleGuess,
        handleNextRound,
        endGame
    } = useSoloSession(session, game, localPlayerID, setSession, setGame);

    // Fetch new session
    useEffect(() => {
        const createSession = async () => {
            try {
                const response = await fetch('/api/session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ gameMode: GameMode.SOLO }),
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la création de la partie');
                }

                const session = await response.json();
                setSession(session);
            } catch (e) {
                throw new Error(`Error creating new session: ${e}`)
            }
        }
        createSession()
    }, []);

    if (!session) {
        return <LoadingComponent message='Chargement de la partie' />
    }

    switch (session.status) {
        case SessionStatus.IN_LOBBY:
            return <LobbyComponent localPlayerID={localPlayerID} session={session} updateConfig={updateConfig} startGame={startGame} />

        case SessionStatus.IN_GAME:
            return <GameComponent localPlayerID={localPlayerID} game={game!} session={session} handleGuess={handleGuess} handleNextRound={handleNextRound} endGame={endGame} />

    }
}