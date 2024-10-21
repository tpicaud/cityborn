import Coord from "@/types/Coord";
import { useState } from "react";

const useGuess = () => {
    const [guess, setGuess] = useState<Coord>();
    const [preGuess, setPreGuess] = useState<Coord>();
    
    const handleGuess = (value: Coord) => {
        setGuess(value);
    };

    const handlePreGuess = (value: Coord) => {
        setPreGuess(value);
    }
    
    return { guess, preGuess, handleGuess, handlePreGuess };
}

export default useGuess;