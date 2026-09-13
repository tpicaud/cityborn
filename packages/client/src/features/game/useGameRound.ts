'use client';

import type { Game, Guess, PlayerId } from '@cityborn/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createTimedOutGuess,
  type RoundDisplayState,
  shouldShowRoundOverlay,
  synchronizeRoundDisplayState,
} from './gameRound';
import type { MapProps } from './mapProps';

const DEFAULT_MAP_CENTER = { lat: 48.8566, lng: 2.3522 };
const DEFAULT_MAP_ZOOM = 2;

export interface GameRoundViewModel {
  mapProps: MapProps;
  preGuess: Guess | undefined;
  displayState: RoundDisplayState;
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
}): GameRoundViewModel {
  const { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp } =
    useGuess(handleGuess);
  const [displayState, setDisplayState] =
    useState<RoundDisplayState>('countdown');
  const roundStatus = game.state.currentRound?.status;

  useEffect(() => {
    const synchronizedDisplayState = synchronizeRoundDisplayState(roundStatus);
    setDisplayState(synchronizedDisplayState);
    if (synchronizedDisplayState === 'results') {
      return;
    }

    resetPreGuess();
  }, [resetPreGuess, roundStatus]);

  const handleCountdownEnd = useCallback(() => {
    setDisplayState('guessing');
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
    displayState,
    showCountdown: displayState === 'countdown',
    showOverlay: shouldShowRoundOverlay(displayState, roundStatus),
    handleCountdownEnd,
    handleIsTimeUp,
  };
}
