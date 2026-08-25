import {
  type Game,
  type GameConfig,
  type Guess,
  type Session,
  SessionMode,
  SessionStatus,
} from '@cityborn/api';
import { toAppError, useError } from '@cityborn/client';
import { applyGuess, beginGame, resolveNextRound } from '@cityborn/core';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSession,
  createSoloGame,
  finalizeGame,
} from '@/server/use-server/session';
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
      if (!result.ok) return invokeError(toAppError(result.error));
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
    if (!result.ok) return invokeError(toAppError(result.error));
    updateSession({ ...current, status: SessionStatus.IN_GAME });
    setGame(beginGame(result.data));
  };

  const guess = (g: Guess) => {
    setGame((prev) => {
      if (!prev?.state.currentRound || !localPlayerID) return prev;
      return applyGuess(prev, localPlayerID, g, [localPlayerID]);
    });
  };

  const nextRound = () => {
    if (!game) return;
    const { game: updatedGame, isGameOver } = resolveNextRound(game);
    setGame(updatedGame);

    const current = sessionRef.current;
    if (isGameOver && current) {
      finalizeGame({ ...current, currentGame: updatedGame }).then((result) => {
        if (!result.ok) invokeError(toAppError(result.error));
      });
    }
  };

  const endGame = () => {
    const current = sessionRef.current;
    if (!current?.currentGame) return;
    updateSession({ ...current, currentGame: undefined });
  };

  const playAgain = async () => {
    if (!sessionRef.current?.currentGame) return;
    await startGame();
  };

  const exitGame = async () => {
    if (!sessionRef.current?.currentGame) return;
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
