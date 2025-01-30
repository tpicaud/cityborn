'use client';

import SoloGameComponent from '@/components/game/SoloGameComponent';
import GameConfig from '@/types/GameConfig';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function SoloGamePage() {
    return (
        <Suspense>
            <Game />
        </Suspense>
    );
}

function Game() {
    const searchParams = useSearchParams()

    // TODO Parse gameconfig from request
    const gameConfig: GameConfig = {}

    return (
        <SoloGameComponent gameConfig={gameConfig} />
    )
}