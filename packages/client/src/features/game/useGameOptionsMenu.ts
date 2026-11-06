'use client';

import { useCallback, useState } from 'react';

export type GameOptionsMenuStep = 'closed' | 'options' | 'leaveConfirmation';

export type GameOptionsMenuOptions = {
  leaveGame: () => Promise<void>;
};

export type GameOptionsMenu = {
  step: GameOptionsMenuStep;
  open: () => void;
  resume: () => void;
  requestLeave: () => void;
  cancelLeave: () => void;
  confirmLeave: () => Promise<void>;
};

export function useGameOptionsMenu({
  leaveGame,
}: GameOptionsMenuOptions): GameOptionsMenu {
  const [step, setStep] = useState<GameOptionsMenuStep>('closed');

  const open = useCallback(() => setStep('options'), []);
  const close = useCallback(() => setStep('closed'), []);
  const requestLeave = useCallback(() => setStep('leaveConfirmation'), []);

  const confirmLeave = useCallback(async () => {
    await leaveGame();
    setStep('closed');
  }, [leaveGame]);

  return {
    step,
    open,
    resume: close,
    requestLeave,
    cancelLeave: close,
    confirmLeave,
  };
}
