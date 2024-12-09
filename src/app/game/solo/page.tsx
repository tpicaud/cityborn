'use client';

import SoloGameComponent from '@/components/game/SoloGameComponent';
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
    const category = searchParams.get('category')

    return (
        <SoloGameComponent category={category as string} />
    )
}