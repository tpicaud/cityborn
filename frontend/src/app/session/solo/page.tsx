'use client';

import { GameComponent } from '@/components/Session/GameComponent';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import { GameMode } from '@/enums/GameMode';
import { SessionStatus } from '@/enums/SessionStatus';
import { useSoloSession } from '@/hooks/useSoloSession';
import { Session } from '@/types/Session';
import { createSession } from '@/utils/SessionService';
import { useEffect, useState } from 'react';

export default function SoloGamePage() {

    const localPlayerID = 'guest';
    const [session, setSession] = useState<Session>();

    // Create new session
    useEffect(() => {
        const fetchSession = async () => {
            const session = await createSession(GameMode.SOLO);
            setSession(session)
        }
        fetchSession();
    }, []);

    const {
        updateGameConfig,
        startGame,
        handleGuess,
        handleNextRound,
        endGame
    } = useSoloSession(session, localPlayerID, setSession);

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