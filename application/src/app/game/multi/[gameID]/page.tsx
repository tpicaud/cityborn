'use client';

import { SoloGameComponent } from '@/components/game/SoloGameComponent';
import LoadingComponent from '@/components/LoadingComponent';
import { useGameContext } from '@/contexts/GameContext';
import { GameStatus } from '@/enums/GameStatus';
import { useSoloGame } from '@/hooks/useSoloGame';
import { GameComponentProps } from '@/types/GameComponentProps';
import { useEffect } from 'react';

export default function MultiGamePage() {

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

    if (game.status === GameStatus.LOBBY) {
        return <></>;
    } else {
        return (
            <SoloGameComponent props={gameComponentProps} />
        );
    }
}