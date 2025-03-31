'use client';

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
import { GameComponent } from '@/components/game/GameComponent';

export default function MultiGamePage() {

    const router = useRouter();
    const { gameID } = useParams<{ gameID: string }>();
    const { game, localPlayerID, setGame, setLocalPlayerID } = useGameContext();
    const gameSocket: GameSocket = useGameSocket(gameID, localPlayerID);

    useEffect(() => {
        const fetchGame = async (gameID: string): Promise<void> => {
            if (gameSocket.isConnected && !game) {
                try {
                    await gameSocket.fetchGame(gameID)
                } catch (error) {
                    console.log(`Erreur lors de la récupération de la partie: ${error}`);
                }
            }
        }
            fetchGame(gameID);
    }, [gameSocket.isConnected])


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
            console.log("updatedGame", gameSocket.gameUpdate);
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

    if (!localPlayerID) {
        return (
            <div className="flex flex-row justify-center items-center mt-16">
                <DialogInput message='Entrez votre pseudo' handleClick={handlePlay} label='Votre pseudo' />
            </div>
        );
    }

    if (!game && localPlayerID) {
        return <LoadingComponent message='Connexion à la partie' />
    }

    if (!game) {
        return <div>Erreur lors de la récupération de la partie</div>
    }

    const gameComponentProps: GameComponentProps = {
        game,
        localPlayerID: localPlayerID!,
        handleGuess,
        handleNextRound,
    }

    switch (game.status) {
        case GameStatus.IN_LOBBY:
            return <LobbyComponent localPlayerID={localPlayerID} game={game} startGame={startGame} />

        case GameStatus.IN_GAME:
            return <GameComponent props={gameComponentProps} />

        case GameStatus.IN_RESULTS:
            return <ResultsComponent playersResults={getGameResult(game)} localPlayerID={localPlayerID} />

        case GameStatus.FINISHED:
            router.push('/')
    }
}