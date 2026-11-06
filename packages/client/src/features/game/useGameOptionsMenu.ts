'use client';

import { useCallback, useState } from 'react';

type GameOptionsMenuStep = 'closed' | 'options' | 'leaveConfirmation';

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

  const open: () => void = useCallback(() => setStep('options'), []);
  const close: () => void = useCallback(() => setStep('closed'), []);
  const requestLeave: () => void = useCallback(
    () => setStep('leaveConfirmation'),
    [],
  );

  const confirmLeave: () => Promise<void> = useCallback(async () => {
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
