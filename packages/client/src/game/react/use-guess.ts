'use client';

import { defaultGuess, type Guess } from '@cityborn/api';
import { useCallback, useState } from 'react';

export interface GuessState {
  preGuess: Guess | undefined;
  handlePreGuess: (guess: Guess) => void;
  handleIsTimeUp: () => void;
  resetPreGuess: () => void;
}

export function useGuess(handleGuess: (guess: Guess) => void): GuessState {
  const [preGuess, setPreGuess] = useState<Guess>();

  const handlePreGuess = useCallback((guess: Guess) => {
    setPreGuess(guess);
  }, []);

  const handleIsTimeUp = useCallback(() => {
    handleGuess({ ...defaultGuess, ...(preGuess ?? {}) });
  }, [preGuess, handleGuess]);

  const resetPreGuess = useCallback(() => {
    setPreGuess(undefined);
  }, []);

  return { preGuess, handlePreGuess, handleIsTimeUp, resetPreGuess };
}
