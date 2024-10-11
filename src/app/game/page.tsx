'use client';

import { useState } from 'react';
import StarComponent from '@/components/StarComponent';
import StarEntity from '@/entities/StarEntity';
import dynamic from 'next/dynamic';

// Get map component with dynamic import
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function GamePage() {

    const Dicaprio: StarEntity = { name: "Leonardo DiCaprio", birthPlace: { lat: 34.0522, lng: -118.2437 } };

    const [star, setStar] = useState(Dicaprio);
    const [guess, setGuess] = useState([]);

    const handleGuess = (guess: any) => {
        setGuess(guess);
    };

    return (
        <div>
            {/* <StarComponent star={star} /> */}
            <MapComponent star={star} />
        </div>
    );
}
