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
import Game from '@/types/Game';
import { useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useWebSocketGame';
import { updateGame } from 'server/gamesStore';

export default function MultiGamePage() {

    const { gameID } = useParams<{ gameID: string }>();
    const { game, localPlayerID, setGame, setLocalPlayerID } = useGameContext();
    const [playerNameInput, setPlayerNameInput] = useState('');
    const { gameUpdate, postGame, joinGame } = useSocket(gameID)

    useEffect(() => {
        const setupGame = async () => {
            if (localPlayerID) {
                if (game) {
                    await postGame(game);
                    console.log("before")
                }
                await joinGame(gameID, localPlayerID)
            }
        }
        setupGame()
    }, [localPlayerID, gameID])

    useEffect(() => {
        if (gameUpdate) {
            setGame(gameUpdate);
        }
    }, [gameUpdate])

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
    } = useMultiGame(game, localPlayerID, setGame);

    const gameComponentProps: GameComponentProps = {
        game,
        localPlayerID,
        handleGuess,
        handleNextRound,
    }

    switch (game.status) {
        case GameStatus.LOBBY:
            return <LobbyComponent game={game} startGame={startGame} />

        case GameStatus.IN_PROGRESS:
            return <MultiGameComponent props={gameComponentProps} />

        case GameStatus.RESULTS:
            return <ResultsComponent playerResults={getGameResult(game, localPlayerID)} />
    }
}

async function joinGame(gameID: string, localPlayerID: string) {
    if (!gameID) return;

    const response = await fetch(`/api/game/join`, {
        method: "PUT",
        body: JSON.stringify({
            gameID: gameID,
            playerID: localPlayerID,
        }),
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        throw new Error(`Le joueur n'a pas pu être ajouté. Erreur HTTP: ${response.status}`);
    }


}

async function getGame(gameID: string): Promise<Game> {
    const response = await fetch(`/api/game/${gameID}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        throw new Error(`Le joueur n'a pas pu être ajouté. Erreur HTTP: ${response.status}`);
    }

    const game: any = response.json();
    return game as Game;
}