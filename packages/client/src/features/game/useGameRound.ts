'use client';

import type { Coord, Game, GuessSubmission, PlayerId } from '@cityborn/api';
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

export type GameRoundOptions = {
  game: Game;
  localPlayerID: PlayerId;
  handleGuess: (guess: GuessSubmission) => void;
};

export type GameRound = {
  mapProps: MapProps;
  preGuess: Coord | undefined;
  countdownEndsAt: number | undefined;
  showCountdown: boolean;
  showOverlay: boolean;
  handleCountdownEnd: () => void;
  handleIsTimeUp: () => void;
};

function useGuess(handleGuess: (guess: GuessSubmission) => void) {
  const [preGuess, setPreGuess] = useState<Coord>();

  const handlePreGuess = useCallback((value: Coord) => {
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
}: GameRoundOptions): GameRound {
  const { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp } =
    useGuess(handleGuess);
  const [state, setState] = useState<RoundDisplayState>('countdown');
  const roundStatus = game.state.currentRound?.status;
  const countdownEndsAt: number | undefined =
    game.state.currentRound?.deadline === undefined
      ? undefined
      : game.state.currentRound.deadline - game.config.timer * 1000;

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
    countdownEndsAt,
    showCountdown: state === 'countdown',
    showOverlay: shouldShowRoundOverlay(state, roundStatus),
    handleCountdownEnd,
    handleIsTimeUp,
  };
}
