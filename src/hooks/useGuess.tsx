import { useState } from "react";
import { Result } from "@/types/Results";
import GuessObject from "@/types/GuessObject";
import Guess from "@/types/Guess";

interface UseGuessProps {
    guessObject: GuessObject;
    recordResult: (newResult: Result) => void;
    nextGuessObject: () => void;
}

const useGuess = ({guessObject, recordResult, nextGuessObject}: UseGuessProps) => {
    const [guess, setGuess] = useState<Guess>();
    const [preGuess, setPreGuess] = useState<Guess>();
    
    const handleGuess = (value: Guess) => {
        setGuess(value);
    };

    const handlePreGuess = (value: Guess) => {
        setPreGuess(value);
    }

    const handleNextGuessObject = () => {
        const newResult: Result = {
            guessObject: guessObject,
            distance: guess!.distance,
            points: guess!.points,
        };
            
        recordResult(newResult);
        nextGuessObject();
        setGuess(undefined);
        setPreGuess(undefined);
    }
    
    return { guess, preGuess, handleGuess, handlePreGuess, handleNextGuessObject };
}

export default useGuess;