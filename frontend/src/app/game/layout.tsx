'use client';

import LoadingComponent from '@/components/others/LoadingComponent';
import { GameProvider } from '@/contexts/GameContext';
import { ReactNode, Suspense } from 'react';

interface GameLayoutProps {
  children: ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  return (
    <GameProvider>
      <Suspense fallback={<LoadingComponent />}>
        {children}
      </Suspense>
    </GameProvider>
  );
}
