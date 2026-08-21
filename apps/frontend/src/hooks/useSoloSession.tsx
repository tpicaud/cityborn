import {
  type Game,
  type GameConfig,
  GameStatus,
  type Guess,
  RoundStatus,
  type Session,
  SessionMode,
  SessionStatus,
} from '@cityborn/api';
import { applyGuess, resolveNextRound } from '@cityborn/core';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useError } from '@/contexts/ErrorContext';
import {
  createSession,
  createSoloGame,
  endSoloGame,
} from '@/server/actions/session';
import type { IUseSession } from './IUseSession';

export function useSoloSession(localPlayerID: string): IUseSession {
  const router = useRouter();
  const { invokeError } = useError();
  const [session, setSession] = useState<Session>();
  const [game, setGame] = useState<Game>();
  const sessionRef = useRef<Session | undefined>(undefined);

  const updateSession = useCallback((next: Session) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  useEffect(() => {
    const init = async () => {
      const result = await createSession({ mode: SessionMode.SOLO });
      if (!result.ok) return invokeError(result.error);
      const session: Session = result.data;
      session.hostID = localPlayerID;
      updateSession(session);
    };
    init();
  }, [localPlayerID, invokeError, updateSession]);

  useEffect(() => {
    if (!game) return;
    const prev = sessionRef.current;
    if (!prev) throw new Error('Cannot update game: session not initialized');
    updateSession({ ...prev, currentGame: game });
  }, [game, updateSession]);

  useEffect(() => {
    console.log(session);
  }, [session]);

  const updateGameConfig = (newConfig: Partial<GameConfig>) => {
    const prev = sessionRef.current;
    if (!prev)
      throw new Error('Cannot update game config: session not initialized');
    updateSession({
      ...prev,
      gameConfig: { ...prev.gameConfig, ...newConfig },
    });
  };

  const startGame = async () => {
    const current = sessionRef.current;
    if (!current) return;
    const result = await createSoloGame(current);
    if (!result.ok) return invokeError(result.error);
    const game: Game = result.data;
    updateSession({ ...current, status: SessionStatus.IN_GAME });
    setGame({
      ...game,
      status: GameStatus.IN_GAME,
      state: {
        ...game.state,
        currentRound: {
          status: RoundStatus.GUESSING,
          guessObjectId: game.state.guessObjectsIds[0],
          playersGuesses: {},
        },
      },
    });
  };

  const guess = (g: Guess) => {
    setGame((prev) => {
      if (!prev?.state.currentRound || !localPlayerID) return prev;
      return applyGuess(prev, localPlayerID, g, [localPlayerID]);
    });
  };

  const nextRound = () => {
    if (!game) return;
    setGame((prev) => (prev ? resolveNextRound(prev).game : prev));
  };

  const endGame = async () => {
    const current = sessionRef.current;
    if (!current?.currentGame) return;
    const result = await endSoloGame(current);
    if (!result.ok) invokeError(result.error);
    updateSession({ ...current, currentGame: undefined });
  };

  const playAgain = async () => {
    if (!sessionRef.current?.currentGame) return;
    const result = await endSoloGame(sessionRef.current);
    if (!result.ok) invokeError(result.error);
    await startGame();
  };

  const exitGame = async () => {
    if (!sessionRef.current?.currentGame) return;
    const result = await endSoloGame(sessionRef.current);
    if (!result.ok) invokeError(result.error);
    router.push('/');
  };

  return {
    session,
    isHost: true,
    updateGameConfig,
    startGame,
    guess,
    nextRound,
    endGame,
    playAgain,
    exitGame,
  };
}
