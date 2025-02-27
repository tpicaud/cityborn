'use client';

import { SoloGameComponent } from '@/components/game/SoloGameComponent';
import LoadingComponent from '@/components/LoadingComponent';
import { useGameContext } from '@/contexts/GameContext';
import { useSoloGame } from '@/hooks/useSoloGame';
import { GameComponentProps } from '@/types/GameComponentProps';
import { useEffect } from 'react';

export default function SoloGamePage() {

    const { game, localPlayerID, setGame } = useGameContext()

    if (!game || !localPlayerID) {
        return <LoadingComponent />
    }
    
    const {
        handleGuess,
        handleNextRound,
        recordResult,
    } = useSoloGame(game, localPlayerID, setGame);

    const gameComponentProps: GameComponentProps = {
        game,
        localPlayerID,
        handleGuess,
        handleNextRound,
        recordResult
    }

    useEffect(() => {
        console.log(game)
    })

    return (
        <SoloGameComponent props={gameComponentProps} />
    );
}