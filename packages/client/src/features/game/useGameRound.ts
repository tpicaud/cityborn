'use client';

import {
  type Coord,
  type Game,
  type PlayerId,
  RoundStatus,
} from '@cityborn/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type RoundDisplayState,
  shouldShowRoundOverlay,
  synchronizeRoundDisplayState,
} from './gameRound';
import {
  canPlaceGuess,
  createRoundAction,
  type RoundAction,
} from './roundAction';
import type { MapProps } from './viewContracts';

const DEFAULT_MAP_CENTER = { lat: 48.8566, lng: 2.3522 };
const DEFAULT_MAP_ZOOM = 2;

export type GameRoundOptions = {
  game: Game;
  localPlayerID: PlayerId;
  isHost: boolean;
  handleGuess: (coordinates: Coord | undefined) => Promise<void>;
  handleNextRound: () => Promise<void>;
};

export type GameRound = {
  mapProps: MapProps;
  roundAction: RoundAction | undefined;
  isTimerRunning: boolean;
  showCountdown: boolean;
  showOverlay: boolean;
  handleRoundAction: () => Promise<void>;
  handleCountdownEnd: () => void;
  handleIsTimeUp: () => void;
};

function useGuess(
  handleGuess: (coordinates: Coord | undefined) => Promise<void>,
) {
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
  isHost,
  handleGuess,
  handleNextRound,
}: GameRoundOptions): GameRound {
  const { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp } =
    useGuess(handleGuess);
  const [state, setState] = useState<RoundDisplayState>('countdown');
  const roundStatus: RoundStatus | undefined = game.state.currentRound?.status;
  const isTimerRunning: boolean = roundStatus === RoundStatus.GUESSING;

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

  const placeGuess = useCallback(
    (coordinates: Coord) => {
      if (canPlaceGuess({ game, localPlayerID })) handlePreGuess(coordinates);
    },
    [game, handlePreGuess, localPlayerID],
  );

  const mapProps = useMemo<MapProps>(
    () => ({
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      preGuess: isTimerRunning ? preGuess : undefined,
      localPlayerID,
      game,
      handlePreGuess: placeGuess,
    }),
    [game, isTimerRunning, localPlayerID, placeGuess, preGuess],
  );

  const roundAction: RoundAction | undefined = createRoundAction({
    game,
    localPlayerID,
    isHost,
    preGuess,
  });

  const handleRoundAction = useCallback(async (): Promise<void> => {
    if (roundAction?.kind === 'nextRound') {
      await handleNextRound();
      return;
    }
    if (preGuess) await handleGuess(preGuess);
  }, [handleGuess, handleNextRound, preGuess, roundAction?.kind]);

  return {
    mapProps,
    roundAction,
    isTimerRunning,
    showCountdown: state === 'countdown',
    showOverlay: shouldShowRoundOverlay(state, roundStatus),
    handleRoundAction,
    handleCountdownEnd,
    handleIsTimeUp,
  };
}
