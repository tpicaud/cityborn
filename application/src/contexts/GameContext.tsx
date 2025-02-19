import Game from '@/types/Game';
import { createContext, useState, ReactNode, useContext } from 'react';

interface GameContextType {
  localPlayerID: string | null;
  game: Game | null;
  setLocalPlayerID: (id: string) => void;
  setGame: (game: Game) => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [localPlayerID, setLocalPlayerID] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);

  return (
    <GameContext.Provider value={{ localPlayerID, game, setLocalPlayerID, setGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
