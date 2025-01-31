'use client';

import { SoloGameComponent } from '@/components/game/SoloGameComponent';
import { Suspense } from 'react';

export default function SoloGamePage() {
    return (
        <Suspense>
            <Game />
        </Suspense>
    );
}

function Game() {
    return (
        <SoloGameComponent />
    )
}