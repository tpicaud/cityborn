import { defaultGuess, type Guess } from '@cityborn/api';
import { useCallback, useState } from 'react';

const useGuess = (handleGuess: (guess: Guess) => void) => {
  const [preGuess, setPreGuess] = useState<Guess>();

  const handlePreGuess = useCallback((value: Guess) => {
    setPreGuess(value);
  }, []);

  const handleIsTimeUp = useCallback(() => {
    const fallbackGuess: Guess = {
      ...defaultGuess,
      ...(preGuess ?? {}),
    };

    handleGuess(fallbackGuess);
  }, [preGuess, handleGuess]);

  const resetPreGuess = useCallback(() => {
    setPreGuess(undefined);
  }, []);

  return { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp };
};

export default useGuess;
