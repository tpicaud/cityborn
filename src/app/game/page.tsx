'use client';

import { useState } from 'react';
import StarComponent from '@/components/StarComponent';
import StarEntity from '@/entities/StarEntity';
import dynamic from 'next/dynamic';

// Get map component with dynamic import
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function GamePage() {

    const Dicaprio: StarEntity = {
        name: "Stéfanos Tsitsipás",
        description: "Joueur de tennis grec",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Tsitsipas_S._MCM22_%2820%29_%2852036915350%29.jpg/250px-Tsitsipas_S._MCM22_%2820%29_%2852036915350%29.jpg",
        birthPlace: { 
            city: "Athènes",
            coordinates: {
                lat: 37.9838,
                lng: 23.7275
            }
        }
    };

    const [star, setStar] = useState(Dicaprio);
    const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null);
    const [hasGuessed, setHasGuessed] = useState(false);


    return (
        <div>
            <StarComponent star={star} />
            <MapComponent star={star} hasGuessed={hasGuessed} setHasGuessed={setHasGuessed} setGuess={setGuess} />
        </div>
    );
}
