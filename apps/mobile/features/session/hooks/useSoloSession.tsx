import {
  type Game,
  type GameConfig,
  type Guess,
  type Session,
  SessionMode,
  SessionStatus,
} from '@cityborn/api';
import { useError } from '@cityborn/client';
import { applyGuess, beginGame, resolveNextRound } from '@cityborn/core';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createSession, createSoloGame, endSoloGame } from '@/lib/api/session';
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

  ////////////////
  // useEffects //
  ////////////////

  useEffect(() => {
    const fetchSession = async () => {
      const result = await createSession({ mode: SessionMode.SOLO });
      if (!result.ok) return invokeError(result.error);
      result.data.hostID = localPlayerID;
      updateSession(result.data);
    };
    fetchSession();
  }, [invokeError, localPlayerID, updateSession]);

  useEffect(() => {
    if (!game) return;

    const prevSession = sessionRef.current;
    if (!prevSession) {
      throw new Error('Cannot update game because session is not initialized');
    }
    updateSession({ ...prevSession, currentGame: game });
  }, [game, updateSession]);

  ///////////////////////
  // Session functions //
  ///////////////////////

  const updateGameConfig = (newConfig: Partial<GameConfig>) => {
    const prevSession = sessionRef.current;
    if (!prevSession) {
      throw new Error(
        'Cannot update game config because session is not initialized',
      );
    }
    updateSession({
      ...prevSession,
      gameConfig: { ...prevSession.gameConfig, ...newConfig },
    });
  };

  ////////////////////
  // Game functions //
  ////////////////////

  const startGame = async () => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;
    const result = await createSoloGame(currentSession);
    if (!result.ok) return invokeError(result.error);

    updateSession({ ...currentSession, status: SessionStatus.IN_GAME });

    setGame(beginGame(result.data));
  };

  const guess = (guess: Guess) => {
    setGame((prevGame) => {
      if (!prevGame?.state.currentRound || !localPlayerID) return prevGame;

      return applyGuess(prevGame, localPlayerID, guess, [localPlayerID]);
    });
  };

  const nextRound = () => {
    if (!game) return;

    setGame((prevGame) =>
      prevGame ? resolveNextRound(prevGame).game : prevGame,
    );
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
    router.replace('/');
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
