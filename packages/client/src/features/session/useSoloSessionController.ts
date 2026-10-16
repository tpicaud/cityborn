'use client';

import type { Game, GameConfig, Guess, PlayerId, Session } from '@cityborn/api';
import { PlayerIdSchema, SessionMode } from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Navigation } from '../../platform/navigation';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import { type CurrentUser, useCurrentUser } from '../auth/authContext';
import { invalidateGameRecords } from '../profile/api/profileQueries';
import { reportActionErrors } from './reportedAction';
import type { SessionController } from './sessionContract';
import {
  advanceSoloRound,
  applySoloGuess,
  startSoloGame,
  withGameConfig,
  withHost,
  withoutGame,
} from './sessionState';

const guestPlayerID: PlayerId = PlayerIdSchema.parse('guest');

export type SoloSessionControllerOptions = {
  navigation: Navigation;
};

export type SoloSessionController = SessionController;

export function useSoloSessionController({
  navigation,
}: SoloSessionControllerOptions): SoloSessionController {
  const { sessionApi }: DomainApis = useDomainApis();
  const { user }: CurrentUser = useCurrentUser();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const localPlayerID: PlayerId = user?.username ?? guestPlayerID;
  const [session, setSession] = useState<Session>();
  const sessionRef = useRef<Session | undefined>(undefined);

  const updateSession = useCallback((next: Session) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const createdSession: Session = await sessionApi.createSession({
        mode: SessionMode.SOLO,
      });
      updateSession(withHost(createdSession, localPlayerID));
    };
    initSession().catch(reportError);
  }, [localPlayerID, sessionApi, reportError, updateSession]);

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

    const game: Game = await sessionApi.createSoloGame(current);
    updateSession(startSoloGame(current, game));
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

    await sessionApi.finalizeGame(nextSession);
    if (!user) return;
    await invalidateGameRecords({ queryClient, userId: user.id });
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
    navigation.returnTo('/');
  };

  return {
    session,
    localPlayerID,
    isHost: true,
    updateGameConfig: reportActionErrors({
      action: updateGameConfig,
      reportError,
    }),
    startGame: reportActionErrors({ action: startGame, reportError }),
    guess: reportActionErrors({ action: guess, reportError }),
    nextRound: reportActionErrors({ action: nextRound, reportError }),
    endGame: reportActionErrors({ action: endGame, reportError }),
    playAgain: reportActionErrors({ action: playAgain, reportError }),
    exitGame: reportActionErrors({ action: exitGame, reportError }),
  };
}
