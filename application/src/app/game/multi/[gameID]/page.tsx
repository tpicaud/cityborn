'use client';

import { MultiGameComponent } from '@/components/game/MultiGameComponent';
import LoadingComponent from '@/components/LoadingComponent';
import ResultsComponent from '@/components/game/ResultsComponent';
import { useGameContext } from '@/contexts/GameContext';
import { GameStatus } from '@/enums/GameStatus';
import { useMultiGame } from '@/hooks/useMultiGame';
import { GameComponentProps } from '@/types/GameComponentProps';
import { getGameResult } from '@/utils/getGameResult';
import { useEffect, useState } from 'react';
import { LobbyComponent } from '@/components/game/LobbyComponent';
import { Card, CardContent, TextField, Button } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { GameSocket, useGameSocket } from '@/hooks/useGameSocket';

export default function MultiGamePage() {

    const router = useRouter();
    const { gameID } = useParams<{ gameID: string }>();
    const { game, localPlayerID, setGame, setLocalPlayerID } = useGameContext();
    const [playerNameInput, setPlayerNameInput] = useState('');
    const gameSocket: GameSocket = useGameSocket(gameID)

    useEffect(() => {
        const setupGame = async () => {
            if (localPlayerID) {
                try {
                    if (game) {
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
    }, [localPlayerID, gameID])

    useEffect(() => {
        if (gameSocket.gameUpdate) {
            setGame(gameSocket.gameUpdate);
        }
    }, [gameSocket.gameUpdate])

    if (!localPlayerID) {
        return (
            <Card style={{ maxWidth: 400, margin: "auto", padding: 20, textAlign: "center" }}>
                <CardContent>
                    <TextField
                        fullWidth
                        label="Votre nom"
                        variant="outlined"
                        value={playerNameInput}
                        onChange={(e) => setPlayerNameInput(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        style={{ marginTop: 10 }}
                        disabled={playerNameInput.trim() === ''}
                        onClick={() => setLocalPlayerID(playerNameInput)}
                    >
                        Jouer
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!game) {
        return <LoadingComponent />
    }

    const {
        startGame,
        handleGuess,
        handleNextRound,
    } = useMultiGame(game, localPlayerID, gameSocket);

    const gameComponentProps: GameComponentProps = {
        game,
        localPlayerID,
        handleGuess,
        handleNextRound,
    }

    switch (game.status) {
        case GameStatus.LOBBY:
            return <LobbyComponent localPlayerID={localPlayerID} game={game} startGame={startGame} />

        case GameStatus.IN_PROGRESS:
            return <MultiGameComponent props={gameComponentProps} />

        case GameStatus.RESULTS:
            return <ResultsComponent playerResults={getGameResult(game, localPlayerID)} />

        case GameStatus.FINISHED:
            router.push('/')
    }
}