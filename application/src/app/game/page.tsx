'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, ReadonlyURLSearchParams } from 'next/navigation';
import { useGameContext } from '@/contexts/GameContext';
import { GameMode } from '@/enums/GameMode';
import { Categories } from '@/enums/Categories';
import Game from '@/types/Game';
import GameConfig from '@/types/GameConfig';
import LoadingComponent from '@/components/utils/LoadingComponent';

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams()

  const { setGame, setLocalPlayerID } = useGameContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create game and initialize context
  useEffect(() => {
    async function fetchGame() {
      try {
        const { gameMode, gameConfig } = parseNewGameParams(searchParams);
        const newGame: Game = await createNewGame(gameMode, gameConfig);

        setGame(newGame)

        router.push(`/game/${gameMode}/${newGame.id}`);

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

async function createNewGame(gameMode: GameMode, gameConfig: GameConfig): Promise<Game> {
  console.log('creating game with params', {
    gameMode,
    gameConfig
  })
  const response = await fetch('/api/game', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameMode, gameConfig }),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la création de la partie');
  }

  return response.json();
}

function parseNewGameParams(searchParams: ReadonlyURLSearchParams) {
  const validCategories = Object.values(Categories);
  const validGameModes = Object.values(GameMode);


  const gameMode: GameMode =
    searchParams.get('gameMode') && validGameModes.includes(searchParams.get('gameMode') as GameMode)
      ? (searchParams.get('gameMode') as GameMode)
      : GameMode.SOLO;

  const timer: number = parseInt(searchParams.get('timer') || '20', 10);
  const nbOfObjects: number = parseInt(searchParams.get('nbOfObjects') || '20', 10);
  const categories: Categories[] = searchParams
    .get('categories')
    ?.split(',')
    .filter((cat) => validCategories.includes(cat as Categories))
    .map((cat) => cat as Categories) || [Categories.TOUTES];

  const gameConfig: GameConfig = {
    categories,
    timer,
    nbOfObjects
  }

  return { gameMode, gameConfig };
}
