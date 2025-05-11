'use client';

import LoadingComponent from '@/components/others/LoadingComponent';
import ResultsComponent from '@/components/Session/ResultsComponent';
import { GameStatus } from '@/enums/GameStatus';
import { useMultiSession } from '@/hooks/useMultiSession';
import { GameComponentProps } from '@/types/GameComponentProps';
import { getGameResult } from '@/utils/getGameResult';
import { useEffect, useState } from 'react';
import { LobbyComponent } from '@/components/Session/LobbyComponent';
import { useParams, useRouter } from 'next/navigation';
import { GameSocket, useGameSocket } from '@/hooks/useGameSocket';
import { DialogInput } from '@/components/others/DialogInput';
import { GameComponent } from '@/components/Session/GameComponent';
import { SessionStatus } from '@/enums/SessionStatus';

export default function MultiGamePage() {

    const router = useRouter();
    const { gameID } = useParams<{ gameID: string }>();
    const gameSocket: GameSocket = useGameSocket(gameID, localPlayerID);
    const [errorMessage, setErrorMessage] = useState<string>()

    useEffect(() => {
        const fetchGame = async (gameID: string): Promise<void> => {
            if (gameSocket.isConnected && !game) {
                try {
                    await gameSocket.fetchGame(gameID)
                } catch (error) {
                    console.log(`Erreur lors de la récupération de la partie: ${error}`);
                    setErrorMessage('Erreur lors du chergement de la partie')
                }
            }
        }
        fetchGame(gameID);
    }, [gameSocket.isConnected])


    useEffect(() => {
        const setupGame = async () => {
            if (localPlayerID) {
                try {
                    try {
                        await gameSocket.fetchGame(gameID)
                    } catch {
                        if (game) await gameSocket.postGame(game);
                    }
                    await gameSocket.joinGame(gameID, localPlayerID)
                } catch (error) {
                    setLocalPlayerID(null)
                    console.error(`Erreur lors de la connexion à la partie: ${error}`);
                    setErrorMessage('Erreur lors de la connexion à la partie')
                }
            }
        }
        setupGame()
    }, [localPlayerID, gameID]);

    useEffect(() => {
        if (gameSocket.gameUpdate) {
            console.log("Game updated", gameSocket.gameUpdate);
            setGame({ ...game, ...gameSocket.gameUpdate });
        }
    }, [gameSocket.gameUpdate])

    useEffect(() => {
        console.log('Current Game:', game);
    }, [game]);

    const {
        startGame,
        handleGuess,
        handleNextRound,
    } = useMultiSession(game, localPlayerID, gameSocket);

    const handlePlay = (input: string) => {
        if (game && !game.players.some(player => player.id === input)) {
            setLocalPlayerID(input);
        }
    };

    if (errorMessage) {
        return <div>{errorMessage}</div>
    }

    if (!game || !gameSocket.isConnected) {
        return <LoadingComponent message='Chargement de la partie' />
    }

    if (!gameSocket.isConnected) {
        return <LoadingComponent message='Connexion au serveur' />
    }

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
        case SessionStatus.IN_LOBBY:
            return <LobbyComponent localPlayerID={localPlayerID} game={game} startGame={startGame} />

        case GameStatus.IN_GAME:
            return <GameComponent props={gameComponentProps} />

        case GameStatus.IN_RESULTS:
            return <ResultsComponent game={game} playersResults={getGameResult(game)} localPlayerID={localPlayerID} />

        case GameStatus.FINISHED:
            router.push('/')
    }
}