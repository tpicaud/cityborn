import React, { createContext, useContext, useState } from 'react';
import { PlayerResults } from '@/types/Results';

interface GameResultsContextType {
    playerResults: PlayerResults | null;
    setPlayerResults: (results: PlayerResults) => void;
}

const GameResultsContext = createContext<GameResultsContextType | undefined>(undefined);

export const GameResultsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [playerResults, setPlayerResults] = useState<PlayerResults | null>(null);
    return (
        <GameResultsContext.Provider value={{ playerResults, setPlayerResults }}>
            {children}
        </GameResultsContext.Provider>
    );
};

export const useGameResults = () => {
    const context = useContext(GameResultsContext);
    if (context === undefined) {
        throw new Error('useGameResults must be used within a GameResultsProvider');
    }
    return context;
};
