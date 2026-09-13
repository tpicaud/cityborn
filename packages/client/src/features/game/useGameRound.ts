'use client';

import type { Game, Guess, PlayerId } from '@cityborn/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createTimedOutGuess,
  type RoundDisplayState,
  shouldShowRoundOverlay,
  synchronizeRoundDisplayState,
} from './gameRound';
import type { MapProps } from './viewContracts';

const DEFAULT_MAP_CENTER = { lat: 48.8566, lng: 2.3522 };
const DEFAULT_MAP_ZOOM = 2;

export interface GameRoundController {
  mapProps: MapProps;
  preGuess: Guess | undefined;
  showCountdown: boolean;
  showOverlay: boolean;
  handleCountdownEnd: () => void;
  handleIsTimeUp: () => void;
}

function useGuess(handleGuess: (guess: Guess) => void) {
  const [preGuess, setPreGuess] = useState<Guess>();

  const handlePreGuess = useCallback((value: Guess) => {
    setPreGuess(value);
  }, []);

  const handleIsTimeUp = useCallback(() => {
    handleGuess(createTimedOutGuess(preGuess));
  }, [handleGuess, preGuess]);

  const resetPreGuess = useCallback(() => {
    setPreGuess(undefined);
  }, []);

  return { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp };
}

export function useGameRound({
  game,
  localPlayerID,
  handleGuess,
}: {
  game: Game;
  localPlayerID: PlayerId;
  handleGuess: (guess: Guess) => void;
}): GameRoundController {
  const { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp } =
    useGuess(handleGuess);
  const [state, setState] = useState<RoundDisplayState>('countdown');
  const roundStatus = game.state.currentRound?.status;

  useEffect(() => {
    const synchronizedDisplayState = synchronizeRoundDisplayState(roundStatus);
    setState(synchronizedDisplayState);
    if (synchronizedDisplayState === 'results') {
      return;
    }

    resetPreGuess();
  }, [resetPreGuess, roundStatus]);

  const handleCountdownEnd = useCallback(() => {
    setState('guessing');
  }, []);

  const mapProps = useMemo<MapProps>(
    () => ({
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      preGuess,
      localPlayerID,
      game,
      handlePreGuess,
    }),
    [game, handlePreGuess, localPlayerID, preGuess],
  );

  return {
    mapProps,
    preGuess,
    showCountdown: state === 'countdown',
    showOverlay: shouldShowRoundOverlay(state, roundStatus),
    handleCountdownEnd,
    handleIsTimeUp,
  };
}
