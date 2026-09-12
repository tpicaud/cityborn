'use client';

import {
  type Game,
  type GameConfig,
  type Guess,
  type Session,
  SessionMode,
  SessionStatus,
} from '@cityborn/api';
import { applyGuess, beginGame, resolveNextRound } from '@cityborn/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useError } from '../../infrastructure/react/error-context';
import type { SessionGateway } from '../../ports/gateways';
import type { SessionNavigation } from '../../ports/navigation';
import type { SessionController } from '../session-controller';

export interface SoloSessionDependencies {
  sessionGateway: SessionGateway;
  navigation: SessionNavigation;
}

export function useSoloSession(
  localPlayerID: string,
  { sessionGateway, navigation }: SoloSessionDependencies,
): SessionController {
  const { invokeError } = useError();
  const [session, setSession] = useState<Session>();
  const [game, setGame] = useState<Game>();
  const sessionRef = useRef<Session | undefined>(undefined);

  const updateSession = useCallback((next: Session) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const result = await sessionGateway.createSession({
        mode: SessionMode.SOLO,
      });
      if (!result.ok) return invokeError(result.error);
      updateSession({ ...result.data, hostID: localPlayerID });
    };
    initSession();
  }, [localPlayerID, sessionGateway, invokeError, updateSession]);

  useEffect(() => {
    if (!game) return;

    const previousSession = sessionRef.current;
    if (!previousSession) {
      throw new Error('Cannot update game: session not initialized');
    }
    updateSession({ ...previousSession, currentGame: game });
  }, [game, updateSession]);

  const runCommand = useCallback(
    async (command: () => Promise<void>) => {
      try {
        await command();
      } catch (error) {
        invokeError(error, 'Une erreur est survenue');
      }
    },
    [invokeError],
  );

  const updateGameConfig = (partialGameConfig: Partial<GameConfig>) =>
    runCommand(async () => {
      const previousSession = sessionRef.current;
      if (!previousSession) {
        throw new Error('Cannot update game config: session not initialized');
      }
      updateSession({
        ...previousSession,
        gameConfig: { ...previousSession.gameConfig, ...partialGameConfig },
      });
    });

  const startGame = () =>
    runCommand(async () => {
      const currentSession = sessionRef.current;
      if (!currentSession) return;

      const result = await sessionGateway.createSoloGame(currentSession);
      if (!result.ok) return invokeError(result.error);

      updateSession({ ...currentSession, status: SessionStatus.IN_GAME });
      setGame(beginGame(result.data));
    });

  const guess = (newGuess: Guess) =>
    runCommand(async () => {
      setGame((previousGame) => {
        if (!previousGame?.state.currentRound) return previousGame;
        return applyGuess(previousGame, localPlayerID, newGuess, [
          localPlayerID,
        ]);
      });
    });

  const nextRound = () =>
    runCommand(async () => {
      if (!game) return;

      const { game: updatedGame, isGameOver } = resolveNextRound(game);
      setGame(updatedGame);

      const currentSession = sessionRef.current;
      if (!isGameOver || !currentSession) return;

      const result = await sessionGateway.finalizeGame({
        ...currentSession,
        currentGame: updatedGame,
      });
      if (!result.ok) invokeError(result.error);
    });

  const endGame = () =>
    runCommand(async () => {
      const currentSession = sessionRef.current;
      if (!currentSession?.currentGame) return;
      updateSession({ ...currentSession, currentGame: undefined });
    });

  const playAgain = async () => {
    if (!sessionRef.current?.currentGame) return;
    await startGame();
  };

  const exitGame = async () => {
    if (!sessionRef.current?.currentGame) return;
    navigation.goHome();
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
