import { useState } from "react";
import Guess from "@/types/Guess";

const useGuess = () => {
    const [preGuess, setPreGuess] = useState<Guess>();

    const handlePreGuess = (value: Guess) => {
        setPreGuess(value);
    }

    const handleIsTimeUp = () => {
        handlePreGuess({
            coordinates: preGuess ? preGuess.coordinates : { lat: 0, lng: 0 },
            distance: preGuess ? preGuess.distance : -1,
            points: preGuess ? preGuess.points : 0,
            win: preGuess ? preGuess.win : false
        });
    }

    const resetPreGuess = () => {
        setPreGuess(undefined);
    }

    return { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp };
}

export default useGuess;