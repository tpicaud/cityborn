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
import useSocket from '@/hooks/useSocket';

export default function MultiGamePage() {

    const { gameID } = useParams();
    const { game, localPlayerID, setGame, setLocalPlayerID } = useGameContext();
    const [playerNameInput, setPlayerNameInput] = useState('');
    const { messages } = useSocket();


    // Join game when localPlayer is defined
    useEffect(() => {

        const initializeGame = async () => {
            if (localPlayerID && !game) {
                try {
                    const gameIDString = Array.isArray(gameID) ? gameID[0] : gameID;

                    await joinGame(gameIDString, localPlayerID);
                    const game = await getGame(gameIDString);
                    setGame(game);
                    console.log('Chargement de la partie réussi')
                } catch {
                    throw new Error('Erreur lors du chargement de la partie')
                }
            }
        }

        initializeGame();
    }, [localPlayerID, game, setGame])
    
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
    
            try {
                const parsedMessage = JSON.parse(lastMessage);
    
                if (parsedMessage.type === 'gameUpdate' && parsedMessage.data) {
                    setGame(parsedMessage.data);
                    console.log('Mise à jour de la partie via WebSocket');
                }
            } catch (error) {
                console.error('Erreur lors du parsing du message reçu:', error);
            }
        }
    }, [messages, setGame]);
    

    useEffect(() => {
        console.log(game)
    }, [game])

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

async function listenGame(localPlayerID: string, game: Game, setGame: React.Dispatch<React.SetStateAction<Game | null>>) {
    const socket = new WebSocket("ws://localhost:3000");
    
    socket.onopen = () => {
        console.log("✅ WebSocket connecté");
        socket.send(JSON.stringify({ type: "join", gameId: game.id, playerId: localPlayerID }));
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("📩 Message reçu :", data);

            if (data.type === "updateGame") {
                setGame(data.game);
            }

        } catch (error) {
            console.error("❌ Erreur parsing WebSocket message :", error);
        }
    };

    socket.onclose = () => {
        console.log("❌ WebSocket déconnecté");
    };

    return () => {
        socket.close();
    };
}