'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGameContext } from '@/contexts/GameContext';
import { GameMode } from '@/enums/GameMode';
import { Categories } from '@/enums/Categories';
import Game from '@/types/Game';
import GameConfig from '@/types/GameConfig';
import LoadingComponent from '@/components/LoadingComponent';

export default function GamePage() {
  const router = useRouter();
  const { setGame, setLocalPlayerID } = useGameContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create game and initialize context
  useEffect(() => {
    async function fetchGame() {
      try {
        const { playerID, gameMode, gameConfig } = parseNewGameParams();
        const newGame = await createNewGame(playerID, gameMode, gameConfig);

        setGame(newGame);
        setLocalPlayerID(playerID)
        router.push(`/game/${newGame.mode}/${newGame.id}`);
      } catch (err) {
        setError('Erreur lors de la création de la partie');
      } finally {
        setLoading(false);
      }
    }

    fetchGame();
  }, []);

  if (loading) return <LoadingComponent />;
  if (error) return <p>{error}</p>;

  return <p>Redirection...</p>; // Il sera remplacé par le redirect
}

async function createNewGame(hostID: string, gameMode: GameMode, gameConfig: GameConfig): Promise<Game> {
  const response = await fetch('/api/game', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ hostID, gameMode, gameConfig }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la création de la partie');
  }

  return response.json();
}

function parseNewGameParams() {
  const validCategories = Object.values(Categories);
  const validGameModes = Object.values(GameMode);
  const searchParams = useSearchParams();

  const playerID = searchParams.get('playerID') || 'guest';
  const gameMode: GameMode =
    searchParams.get('gameMode') && validGameModes.includes(searchParams.get('gameMode') as GameMode)
      ? (searchParams.get('gameMode') as GameMode)
      : GameMode.SOLO;

  const timer = parseInt(searchParams.get('timer') || '20', 10);
  const nbOfObjects = parseInt(searchParams.get('nbOfObjects') || '20', 10);
  const categories: Categories[] = searchParams
    .get('category')
    ?.split(',')
    .filter((cat) => validCategories.includes(cat as Categories))
    .map((cat) => cat as Categories) || [Categories.TOUTES];

  return { playerID, gameMode, gameConfig: { categories, timer, nbOfObjects } };
}
