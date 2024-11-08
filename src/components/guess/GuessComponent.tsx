import MapComponent from "@/components/guess/MapComponent";
import OverlayComponent from "@/components/guess/OverlayComponent";
import useGuess from "@/hooks/useGuess";
import GuessObject from "@/types/GuessObject";
import { Result } from "@/types/Results";
import { useEffect, useState } from "react";

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

    const [refreshCounter, setRefreshCounter] = useState(0);
    const { preGuess, guess, handlePreGuess, handleGuess, handleNextGuessObject } = useGuess({ guessObject, recordResult, nextGuessObject });

    useEffect(() => {
        setRefreshCounter(prev => prev + 1);
    }, [guessObject]);

    return (
        <div>
            <MapComponent
                key={refreshCounter}
                preGuess={preGuess}
                guess={guess}
                answer={guessObject.coordinates}
                handlePreGuess={handlePreGuess}
            />

            <OverlayComponent
                preGuess={preGuess}
                guess={guess}
                guessObject={guessObject}
                handleGuess={handleGuess}
                handleNextGuessObject={handleNextGuessObject}
            />
        </div>
    );
}

export default GuessComponent;