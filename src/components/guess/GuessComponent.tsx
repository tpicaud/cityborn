'use client';

import OverlayComponent from "@/components/guess/OverlayComponent";
import useGuess from "@/hooks/useGuess";
import GuessObject from "@/types/GuessObject";
import { Result } from "@/types/Results";
import dynamic from "next/dynamic";
import { useState } from "react";
import CountdownBeforeGameComponent from "./CountdownBeforeGameComponent";

const GoogleMapComponent = dynamic(() => import('@/components/guess/maps/GoogleMapComponent'), { ssr: false });

interface GuessComponentProps {
    guessObject: GuessObject,
    nextGuessObject: () => void,
    recordResult: (newResult: Result) => void,
}

const GuessComponent: React.FC<GuessComponentProps> = ({
    guessObject,
    nextGuessObject,
    recordResult,
}) => {

    const { preGuess, guess, handlePreGuess, handleGuess, handleIsTimeUp, handleNextGuessObject } = useGuess({ guessObject, recordResult, nextGuessObject });
    const [isCountdownBeforeGameFinished, setisCountdownBeforeGameFinished] = useState(false);

    // Map properties
    const mapProps = {
        center: { lat: 48.8566, lng: 2.3522 },
        zoom: 2,
        preGuess,
        guess,
        answer: guessObject.coordinates,
        handlePreGuess,
    };

    return (
        <div>
            <div className="fixed w-full h-full z-0">
                <GoogleMapComponent
                    API_KEY={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}
                    mapProps={mapProps}
                />
            </div>

            {!isCountdownBeforeGameFinished && (
                <CountdownBeforeGameComponent onCountdownEnd={() => setisCountdownBeforeGameFinished(true)} />
            )}
            
            {isCountdownBeforeGameFinished && (
                <div className="z-10">
                    <OverlayComponent
                        preGuess={preGuess}
                        guess={guess}
                        handleIsTimeUp={handleIsTimeUp}
                        guessObject={guessObject}
                        handleGuess={handleGuess}
                        handleNextGuessObject={handleNextGuessObject}
                    />
                </div>
            )}
        </div>
    );
}

export default GuessComponent;