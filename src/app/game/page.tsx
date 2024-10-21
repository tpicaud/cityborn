'use client';

import { useState } from 'react';
import StarComponent from '@/components/StarComponent';
import StarEntity from '@/types/ObjectToGuess';
import dynamic from 'next/dynamic';
import { starList } from '@/data/stars';
import { GameSession } from '@/types/GameSession';
import ResultsComponent from '@/components/ResultsComponent';
import { useRouter } from 'next/navigation';

// Get map component with dynamic import
const MapComponent = dynamic(() => import('@/components/guess/MapComponent'), { ssr: false });

export default function GamePage() {

    const router = useRouter();

    const stars: StarEntity[] = starList;

    const [gameSession, setGameSession] = useState<GameSession>({ results: [] });
    const [isFinished, setIsFinished] = useState(false);

    const [currentStarIndex, setCurrentStarIndex] = useState(0);
    const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
    const [hasGuessed, setHasGuessed] = useState(false);
    const [distance, setDistance] = useState(0);

    const currentStar: StarEntity = stars[currentStarIndex];

    const handleNextStar = () => {
        // Save guess result
        saveGuessResult();

        if (currentStarIndex < stars.length - 1) {
            setCurrentStarIndex(currentStarIndex + 1); // Move to next star
            resetGuess(); // Reset guess
        } else {
            setIsFinished(true); // Game is finished
        }
    };

    const resetGuess = () => {
        setHasGuessed(false);
        setMarker(null);
    };

    const saveGuessResult = () => {
        const points = calculatePoints(distance);
        const result = { star: currentStar.name, distance, points };
        setGameSession(prevSession => ({
            ...prevSession,
            results: [...prevSession.results, result]
        }));
    };

    const calculatePoints = (distance: number) => {
        const maxDistance = 10000;
        return Math.max(0, Math.round(maxDistance - distance));
    };

    const handleEndGame = () => {
        // Reset game session and state
        resetGuess();
        setGameSession({ results: [] });
        setCurrentStarIndex(0);
        setIsFinished(false);
        router.push('/');
    };

    return (
        <div>
            <StarComponent star={currentStar} />
            <MapComponent
                key={currentStarIndex}
                star={currentStar}
                hasGuessed={hasGuessed}
                marker={marker}
                distance={distance}
                setMarker={setMarker}
                setHasGuessed={setHasGuessed}
                handleNextStar={handleNextStar}
                setDistance={setDistance}
            />
            {isFinished && (
                <ResultsComponent gameSession={gameSession} handleEndGame={handleEndGame} />
            )}
        </div>
    );
}
