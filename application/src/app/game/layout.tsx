'use client';

import { GameProvider } from '@/contexts/GameContext';
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

  // TODO Parse gameconfig from request
  const searchParams = useSearchParams()

  const gameConfig: GameConfig = {
    categories: searchParams.get('category') ? searchParams.get('category')!.split(',') : ['all'],
    timer: parseInt(searchParams.get('timer') || '20'),
    nbOfObjects: parseInt(searchParams.get('nbOfObjects') || '6')
  }

  // TODO fetch new game with gameConfig

  // Contexte variables
  const playerID = '';
  const newGame: Game = { // TODO replace game
    id: "",
    hostID: "",
    status: GameStatus.LOBBY, // Tu peux remplacer par le statut approprié
    config: {} as GameConfig, // Assure-toi que GameConfig est correctement défini
    players: [],
    guessObjects: [],
    currentRound: {
      status: RoundStatus.GUESSING, // Remplace par un statut approprié
      playersGuesses: {},
      guessObject: {} as GuessObject,
    },
  };


  return (
    <GameProvider newGame={newGame} playerID={playerID}>
      {children}
    </GameProvider>
  );
}
