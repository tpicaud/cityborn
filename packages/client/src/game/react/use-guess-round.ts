'use client';

import type { Guess, RoundStatus } from '@cityborn/api';
import { useCallback, useEffect, useState } from 'react';
import {
  isOverlayVisible,
  type RoundPhase,
  resolveRoundPhase,
  shouldResetPreGuess,
} from '../round-phase';
import { useGuess } from './use-guess';

export interface GuessRound {
  preGuess: Guess | undefined;
  phase: RoundPhase;
  isOverlayVisible: boolean;
  handlePreGuess: (guess: Guess) => void;
  handleIsTimeUp: () => void;
  handleCountdownEnd: () => void;
}

export function useGuessRound(
  roundStatus: RoundStatus | undefined,
  handleGuess: (guess: Guess) => void,
): GuessRound {
  const { preGuess, handlePreGuess, handleIsTimeUp, resetPreGuess } =
    useGuess(handleGuess);
  const [phase, setPhase] = useState<RoundPhase>('countdown');

  useEffect(() => {
    if (shouldResetPreGuess(roundStatus)) {
      resetPreGuess();
    }
    setPhase(resolveRoundPhase(roundStatus));
  }, [roundStatus, resetPreGuess]);

  const handleCountdownEnd = useCallback(() => setPhase('guessing'), []);

  return {
    preGuess,
    phase,
    isOverlayVisible: isOverlayVisible(phase, roundStatus),
    handlePreGuess,
    handleIsTimeUp,
    handleCountdownEnd,
  };
}
