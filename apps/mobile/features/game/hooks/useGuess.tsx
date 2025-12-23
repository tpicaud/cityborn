import { useState } from 'react';
import { defaultGuess, Guess } from '@cityborn/types';

const useGuess = (handleGuess: (guess: Guess) => void) => {
  const [preGuess, setPreGuess] = useState<Guess>();

  const handlePreGuess = (value: Guess) => {
    setPreGuess(value);
  };

  const handleIsTimeUp = () => {
    const fallbackGuess: Guess = {
      ...defaultGuess,
      ...(preGuess ?? {}), // écrase les valeurs si `preGuess` existe
    };

    handlePreGuess(fallbackGuess);
    handleGuess(fallbackGuess);
  };

  const resetPreGuess = () => {
    setPreGuess(undefined);
  };

  return { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp };
};

export default useGuess;
