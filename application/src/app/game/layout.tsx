'use client';

import { GameProvider } from '@/contexts/GameContext';
import { Categories } from '@/enums/Categories';
import { GameStatus } from '@/enums/GameStatus';
import { RoundStatus } from '@/enums/RoundStatus';
import Game from '@/types/Game';
import GameConfig from '@/types/GameConfig';
import GuessObject from '@/types/GuessObject';
import { useSearchParams } from 'next/navigation';
import { ReactNode } from 'react';

interface GameLayoutProps {
  children: ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {

  const searchParams = useSearchParams();

  // parsing request
  const playerID = searchParams.get('playerID') || 'guest'

  const validCategories = Object.values(Categories);

  const categories: Categories[] = searchParams.get('category')
    ? searchParams.get('category')!.split(',')
      .filter(cat => validCategories.includes(cat as Categories)) // Filtrer les catégories valides
      .map(cat => cat as Categories) // Convertir les valeurs string en Categories
    : [Categories.TOUTES];

  const gameConfig: GameConfig = {
    categories,
    timer: parseInt(searchParams.get('timer') || '20', 10),
    nbOfObjects: parseInt(searchParams.get('nbOfObjects') || '6', 10),
  };


  // TODO fetch new game with gameConfig
  async function createNewGame(gameConfig: GameConfig, hostID: string) {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostID, gameConfig })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création de la game');
    }

    const newGame: Game = await response.json();
    return newGame;
  }


  const newGame = createNewGame(gameConfig, playerID)


  return (
    <GameProvider newGame={newGame} playerID={playerID}>
      {children}
    </GameProvider>
  );
}
