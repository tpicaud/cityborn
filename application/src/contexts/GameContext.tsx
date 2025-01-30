import Game from '@/types/Game';
import GameConfig from '@/types/GameConfig';
import { createContext, useState, ReactNode, useContext } from 'react';

interface GameContextType {
  localPlayerID: string;
  gameConfig: GameConfig | undefined;
  game: Game | undefined;
  setLocalPlayerID: (id: string) => void;
  setGameConfig: (gameConfig: GameConfig) => void;
  setGame: (game: Game) => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [localPlayerID, setLocalPlayerID] = useState<string>('');
  const [game, setGame] = useState<Game>()
  const [gameConfig, setGameConfig] = useState<GameConfig | undefined>()

  return (
    <GameContext.Provider value={{ localPlayerID, gameConfig, game, setLocalPlayerID, setGameConfig, setGame }}>
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
