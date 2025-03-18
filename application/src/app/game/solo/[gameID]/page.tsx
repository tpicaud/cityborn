'use client';

import ResultsComponent from '@/components/game/ResultsComponent';
import { SoloGameComponent } from '@/components/game/SoloGameComponent';
import LoadingComponent from '@/components/utils/LoadingComponent';
import { useGameContext } from '@/contexts/GameContext';
import { GameStatus } from '@/enums/GameStatus';
import { RoundStatus } from '@/enums/RoundStatus';
import { useSoloGame } from '@/hooks/useSoloGame';
import { GameComponentProps } from '@/types/GameComponentProps';
import { getGameResult } from '@/utils/getGameResult';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function SoloGamePage() {

    const { game, localPlayerID, setLocalPlayerID, setGame } = useGameContext();
    const router = useRouter();

    useEffect(() => {
        setLocalPlayerID('guest');
    }, [localPlayerID])

    useEffect(() => {
        if (!localPlayerID || !game) return;

        const setupGame = () => {
            setGame((prevGame) => {
                if (!prevGame) return prevGame;

                return {
                    ...prevGame,
                    status: GameStatus.IN_PROGRESS,
                    players: [
                        ...prevGame.players,
                        {
                            id: localPlayerID,
                            results: [],
                            connected: true
                        }
                    ],
                    currentRound: {
                        status: RoundStatus.GUESSING,
                        guessObject: prevGame.guessObjects[0],
                        playersGuesses: {},
                    },
                };
            });
        };

        setupGame();
    }, [localPlayerID]);


    if (!game || !localPlayerID) {
        return <LoadingComponent message='Chargement de la partie' />
    }

    const {
        handleGuess,
        handleNextRound
    } = useSoloGame(game, localPlayerID, setGame);

    const gameComponentProps: GameComponentProps = {
        game,
        localPlayerID,
        handleGuess,
        handleNextRound,
    }

    switch (game.status) {
        case GameStatus.LOBBY:
            <LoadingComponent message='Démarrage de la partie' />

        case GameStatus.IN_PROGRESS:
            return <SoloGameComponent props={gameComponentProps} />

        case GameStatus.RESULTS:
            return <ResultsComponent playersResults={getGameResult(game)} localPlayerID={localPlayerID} />

        case GameStatus.FINISHED:
            router.push('/');
            break;
        default:
            <div>Erreur inconnu</div>;
    }
}