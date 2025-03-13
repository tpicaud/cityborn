'use client';

import { SoloGameComponent } from '@/components/game/SoloGameComponent';
import LoadingComponent from '@/components/LoadingComponent';
import { useGameContext } from '@/contexts/GameContext';
import { GameStatus } from '@/enums/GameStatus';
import { useSoloGame } from '@/hooks/useSoloGame';
import { GameComponentProps } from '@/types/GameComponentProps';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function SoloGamePage() {

    const { game, localPlayerID, setGame } = useGameContext()
    const router = useRouter()
    const pathname = usePathname()


    if (!game || !localPlayerID) {
        return <LoadingComponent />
    }
    
    const {
        handleGuess,
        handleNextRound,
    } = useSoloGame(game, localPlayerID, setGame);

    const gameComponentProps: GameComponentProps = {
        game,
        localPlayerID,
        handleGuess,
        handleNextRound,
    }

    useEffect(() => {
        console.log(game)
    })

    useEffect(() => {
        if (game?.status === GameStatus.RESULTS) {
            router.push(`${pathname}/results`);
        }
    }, [game]);

    return (
        <SoloGameComponent props={gameComponentProps} />
    );
}