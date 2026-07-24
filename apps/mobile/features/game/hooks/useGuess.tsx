import { defaultGuess, type Guess } from '@cityborn/api';
import { useState } from 'react';

const useGuess = (handleGuess: (guess: Guess) => void) => {
  const [preGuess, setPreGuess] = useState<Guess>();

  const handlePreGuess = (value: Guess) => {
    setPreGuess(value);
  };

  const handleIsTimeUp = () => {
    const fallbackGuess: Guess = {
      ...defaultGuess,
      ...(preGuess ?? {}),
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
