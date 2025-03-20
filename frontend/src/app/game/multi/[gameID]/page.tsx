'use client';

import { MultiGameComponent } from '@/components/game/MultiGameComponent';
import LoadingComponent from '@/components/others/LoadingComponent';
import ResultsComponent from '@/components/game/ResultsComponent';
import { useGameContext } from '@/contexts/GameContext';
import { GameStatus } from '@/enums/GameStatus';
import { useMultiGame } from '@/hooks/useMultiGame';
import { GameComponentProps } from '@/types/GameComponentProps';
import { getGameResult } from '@/utils/getGameResult';
import { useEffect } from 'react';
import { LobbyComponent } from '@/components/game/LobbyComponent';
import { useParams, useRouter } from 'next/navigation';
import { GameSocket, useGameSocket } from '@/hooks/useGameSocket';
import { DialogInput } from '@/components/others/DialogInput';

export default function MultiGamePage() {

    const router = useRouter();
    const { gameID } = useParams<{ gameID: string }>();
    const { game, localPlayerID, setGame, setLocalPlayerID } = useGameContext();
    const gameSocket: GameSocket = useGameSocket(gameID);

    useEffect(() => {
        const fetchGame = async (gameID: string): Promise<void> => {
            if (gameSocket.isInitialized) {
                try {
                    const game = await gameSocket.fetchGame(gameID)
                    setGame(game)
                } catch (error) {
                    console.error(`Erreur lors de la récupération de la partie: ${error}`);
                }
            }
        }
        fetchGame(gameID);
    }, [gameSocket.isInitialized])

    useEffect(() => {
        const setupGame = async () => {
            if (localPlayerID) {
                try {
                    if (game && game.hostID === '') {
                        await gameSocket.postGame(game);
                    }
                    await gameSocket.joinGame(gameID, localPlayerID)
                } catch (error) {
                    setLocalPlayerID(null)
                    console.error(`Erreur lors de la connexion à la partie: ${error}`);
                }
            }
        }
        setupGame()
    }, [localPlayerID, gameID]);

    useEffect(() => {
        if (gameSocket.gameUpdate) {
            setGame(gameSocket.gameUpdate);
        }
    }, [gameSocket.gameUpdate])

    const {
        startGame,
        handleGuess,
        handleNextRound,
    } = useMultiGame(game, localPlayerID, gameSocket);

    const handlePlay = (input: string) => {
        if (game && !game.players.some(player => player.id === input)) {
            setLocalPlayerID(input);
        }
    };

    if (!game) {
        return <LoadingComponent message='Connexion à la partie' />
    }

    if (!localPlayerID) {
        return (
            <div className="flex flex-row justify-center items-center mt-16">
                <DialogInput message='Entrez votre pseudo' handleClick={handlePlay} label='Votre pseudo' />
            </div>
        );
    }

    const gameComponentProps: GameComponentProps = {
        game,
        localPlayerID: localPlayerID!,
        handleGuess,
        handleNextRound,
    }

    switch (game.status) {
        case GameStatus.LOBBY:
            return <LobbyComponent localPlayerID={localPlayerID} game={game} startGame={startGame} />

        case GameStatus.IN_PROGRESS:
            return <MultiGameComponent props={gameComponentProps} />

        case GameStatus.RESULTS:
            return <ResultsComponent playersResults={getGameResult(game)} localPlayerID={localPlayerID} />

        case GameStatus.FINISHED:
            router.push('/')
    }
}