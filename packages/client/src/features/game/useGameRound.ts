'use client';

import {
  type Coord,
  type Game,
  type PlayerId,
  RoundStatus,
} from '@cityborn/api';
import {
  type RefObject,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import { createRoundTiming, synchronizeRoundTiming } from './gameRound';
import { canSubmitGuess } from './roundResult';
import { useRoundCountdown } from './roundTimer';
import type { GameComponentProps, MapProps } from './viewContracts';

const DEFAULT_MAP_CENTER: Coord = { lat: 48.8566, lng: 2.3522 };
const DEFAULT_MAP_ZOOM: number = 2;

export type GameRoundOptions = {
  game: Game;
  gameReceivedAt?: number;
  localPlayerID: PlayerId;
  isConnectionReady?: boolean;
  handleGuess: GameComponentProps['handleGuess'];
};

export type GameRound = {
  mapProps: MapProps;
  countdown: number;
  endsAt: number;
  canGuess: boolean;
  submitPreGuess: () => Promise<void>;
};

type LocalRound = {
  key: string;
  timing: ReturnType<typeof createRoundTiming>;
  preGuess?: Coord;
};

export function useGameRound({
  game,
  gameReceivedAt,
  localPlayerID,
  isConnectionReady = true,
  handleGuess,
}: GameRoundOptions): GameRound {
  const round: Game['state']['currentRound'] = game.state.currentRound;
  const roundKey: string = `${game.id}:${round?.guessObjectId ?? ''}`;
  const now: number = performance.now();
  const incomingTiming: LocalRound['timing'] = createRoundTiming({
    serverEndsAt: round?.endsAt,
    serverTime: round?.serverTime,
    receivedAt: gameReceivedAt ?? now,
    totalTimeInSeconds: game.config.timer,
  });
  const [localRound, setLocalRound] = useState<LocalRound>({
    key: roundKey,
    timing: incomingTiming,
  });
  const isSameRound: boolean = localRound.key === roundKey;
  const timing: LocalRound['timing'] = isSameRound
    ? synchronizeRoundTiming({
        current: localRound.timing,
        incoming: incomingTiming,
        now,
      })
    : incomingTiming;
  if (timing !== localRound.timing) {
    setLocalRound({
      key: roundKey,
      timing,
      preGuess: isSameRound ? localRound.preGuess : undefined,
    });
  }

  const { guessingStartsAt, endsAt }: LocalRound['timing'] = timing;
  const isGuessing: boolean = round?.status === RoundStatus.GUESSING;
  const countdown: number = useRoundCountdown(
    isGuessing ? guessingStartsAt : undefined,
  );
  const automaticallySubmittedRoundKey: RefObject<string | undefined> = useRef<
    string | undefined
  >(undefined);
  const hasGuessed: boolean =
    round?.playersGuesses?.[localPlayerID] !== undefined;

  const expireRound = useEffectEvent(
    ({ key, deadline }: { key: string; deadline: number }): void => {
      if (
        key !== roundKey ||
        deadline !== endsAt ||
        !isConnectionReady ||
        !isGuessing ||
        hasGuessed ||
        automaticallySubmittedRoundKey.current === roundKey
      )
        return;
      automaticallySubmittedRoundKey.current = roundKey;
      void handleGuess(localRound.preGuess);
    },
  );

  useEffect(() => {
    if (!isConnectionReady || !isGuessing || hasGuessed) return;
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(
      () => expireRound({ key: roundKey, deadline: endsAt }),
      Math.max(0, Math.ceil(endsAt - performance.now())),
    );
    return () => clearTimeout(timeoutId);
  }, [endsAt, hasGuessed, isConnectionReady, isGuessing, roundKey]);

  const canGuess: boolean =
    isConnectionReady &&
    countdown === 0 &&
    canSubmitGuess(game, localPlayerID, localRound.preGuess);

  return {
    mapProps: {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      preGuess: localRound.preGuess,
      localPlayerID,
      game,
      handlePreGuess: (coordinates: Coord) => {
        if (!isGuessing || countdown > 0 || performance.now() >= endsAt) return;
        setLocalRound({ ...localRound, preGuess: coordinates });
      },
    },
    countdown,
    endsAt,
    canGuess,
    submitPreGuess: async () => {
      if (!canGuess) return;
      await handleGuess(localRound.preGuess);
    },
  };
}
