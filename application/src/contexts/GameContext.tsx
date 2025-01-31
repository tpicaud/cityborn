import Game from '@/types/Game';
import GameConfig from '@/types/GameConfig';
import { createContext, useState, ReactNode, useContext } from 'react';

interface GameContextType {
  localPlayerID: string;
  game: Game;
  setLocalPlayerID: (id: string) => void;
  setGame: (game: Game) => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children, newGame, playerID }: { children: ReactNode, newGame: Game, playerID: string }) {
  const [localPlayerID, setLocalPlayerID] = useState<string>(playerID);
  const [game, setGame] = useState<Game>(newGame)

  return (
    <GameContext.Provider value={{ localPlayerID, game, setLocalPlayerID, setGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
    const context = useContext(GameContext)
    if (!context) {
        throw new Error('useGameContext must be used within a GameProvider')
    }
    return context
}
