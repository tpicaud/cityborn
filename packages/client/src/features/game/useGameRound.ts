'use client';

import type { Coord, Game, PlayerId } from '@cityborn/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type RoundDisplayState,
  shouldShowRoundOverlay,
  synchronizeRoundDisplayState,
} from './gameRound';
import type { MapProps } from './viewContracts';

const DEFAULT_MAP_CENTER = { lat: 48.8566, lng: 2.3522 };
const DEFAULT_MAP_ZOOM = 2;

export type GameRoundOptions = {
  game: Game;
  localPlayerID: PlayerId;
  handleGuess: (coordinates: Coord | undefined) => void;
};

export type GameRound = {
  mapProps: MapProps;
  preGuess: Coord | undefined;
  showCountdown: boolean;
  showOverlay: boolean;
  handleCountdownEnd: () => void;
  handleIsTimeUp: () => void;
};

function useGuess(handleGuess: (coordinates: Coord | undefined) => void) {
  const [preGuess, setPreGuess] = useState<Coord>();

  const handlePreGuess = useCallback((coordinates: Coord) => {
    setPreGuess(coordinates);
  }, []);

  const handleIsTimeUp = useCallback(() => {
    handleGuess(preGuess);
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
}: GameRoundOptions): GameRound {
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
