'use client';

import { GameResultsProvider } from '@/contexts/GameResultsContext';
import { ReactNode } from 'react';

interface GameLayoutProps {
  children: ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  return (
    <GameResultsProvider>
      {children}
    </GameResultsProvider>
  );
}
