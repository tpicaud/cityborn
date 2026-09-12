'use client';

import type { GameConfig, Guess, Session } from '@cityborn/api';
import { SessionMode } from '@cityborn/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Navigation } from '../../platform/navigation';
import { useError } from '../../shared/errorContext';
import type { SessionApi } from './sessionApi';
import type { SessionController } from './sessionContract';
import {
  advanceSoloRound,
  applySoloGuess,
  startSoloGame,
  withGameConfig,
  withHost,
  withoutGame,
} from './sessionState';

export interface SoloSessionOptions {
  localPlayerID: string;
  sessionApi: SessionApi;
  navigation: Navigation;
}

export function useSoloSession({
  localPlayerID,
  sessionApi,
  navigation,
}: SoloSessionOptions): SessionController {
  const { invokeError } = useError();
  const [session, setSession] = useState<Session>();
  const sessionRef = useRef<Session | undefined>(undefined);

  const updateSession = useCallback((next: Session) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const result = await sessionApi.createSession({ mode: SessionMode.SOLO });
      if (!result.ok) return invokeError(result.error);
      updateSession(withHost(result.data, localPlayerID));
    };
    initSession();
  }, [localPlayerID, sessionApi, invokeError, updateSession]);

  const requireSession = (action: string): Session => {
    const current = sessionRef.current;
    if (!current) throw new Error(`${action} failed: session not initialized`);
    return current;
  };

  const updateGameConfig = async (gameConfig: Partial<GameConfig>) => {
    const current = requireSession('Updating game config');
    updateSession(withGameConfig(current, gameConfig));
  };

  const startGame = async () => {
    const current = sessionRef.current;
    if (!current) return;

    const result = await sessionApi.createSoloGame(current);
    if (!result.ok) return invokeError(result.error);

    updateSession(startSoloGame(current, result.data));
  };

  const guess = async (playerGuess: Guess) => {
    const current = sessionRef.current;
    if (!current) return;

    updateSession(applySoloGuess(current, localPlayerID, playerGuess));
  };

  const nextRound = async () => {
    const current = sessionRef.current;
    if (!current?.currentGame) return;

    const { session: nextSession, isGameOver } = advanceSoloRound(current);
    updateSession(nextSession);

    if (!isGameOver) return;

    const result = await sessionApi.finalizeGame(nextSession);
    if (!result.ok) invokeError(result.error);
  };

  const endGame = async () => {
    const current = sessionRef.current;
    if (!current?.currentGame) return;

    updateSession(withoutGame(current));
  };

  const playAgain = async () => {
    if (!sessionRef.current?.currentGame) return;
    await startGame();
  };

  const exitGame = async () => {
    if (!sessionRef.current?.currentGame) return;
    navigation.replace('/');
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
