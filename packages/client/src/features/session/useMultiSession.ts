'use client';

import type {
  GameConfig,
  Guess,
  PlayerId,
  Session,
  SessionId,
} from '@cityborn/api';
import {
  SessionStatus,
  sessionWsEvent,
  sessionWsServerEvent,
} from '@cityborn/api';
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Navigation } from '../../platform/navigation';
import type { SocketFactory } from '../../platform/socket';
import { useError } from '../../shared/errorContext';
import type { WsConnectionStatus } from '../../ws/wsConnection';
import type { WsEmit } from '../../ws/wsEmit';
import type { SessionApi } from './sessionApi';
import type { SessionController } from './sessionContract';
import { isHostOf, mergeSessionUpdate, withStatus } from './sessionState';
import { useSocket } from './useSocket';

export type MultiSessionOptions = {
  localPlayerID: PlayerId | undefined;
  sessionID: SessionId;
  sessionApi: SessionApi;
  navigation: Navigation;
  createSocket: SocketFactory;
};

export type MultiSessionController = SessionController & {
  connectionStatus: WsConnectionStatus;
  retryConnection: () => void;
  join: (playerID: PlayerId) => Promise<void>;
  updateHost: (newHostID: PlayerId) => Promise<void>;
  kickPlayer: (playerToKick: PlayerId) => Promise<void>;
};

export function useMultiSession({
  localPlayerID,
  sessionID,
  sessionApi,
  navigation,
  createSocket,
}: MultiSessionOptions): MultiSessionController {
  const { invokeError } = useError();
  const [session, setSession] = useState<Session>();
  const joinedPlayerID: RefObject<PlayerId | null> = useRef<PlayerId | null>(
    null,
  );
  const joinAttempted: RefObject<boolean> = useRef<boolean>(false);

  const restoreSession = useCallback(
    async (emit: WsEmit) => {
      const playerID: PlayerId | null = joinedPlayerID.current;
      if (!playerID) return;
      await emit(sessionWsEvent.reconnect, { sessionID, playerID });
    },
    [sessionID],
  );

  const { connectionStatus, retryConnection, emit, on, off } = useSocket({
    createSocket,
    restoreSession,
  });

  useEffect(() => {
    const loadSession = async () => {
      const result = await sessionApi.fetchSession(sessionID);
      if (!result.ok) return invokeError(result.error);
      setSession(result.data);
    };
    loadSession();
  }, [sessionID, sessionApi, invokeError]);

  useEffect(() => {
    const handleSessionUpdate = (incoming: Session) => {
      setSession((previous) => mergeSessionUpdate(previous, incoming));
    };

    on(sessionWsServerEvent.update, handleSessionUpdate);
    return () => off(sessionWsServerEvent.update, handleSessionUpdate);
  }, [on, off]);

  const join = useCallback(
    async (playerID: PlayerId) => {
      if (!session || !playerID)
        throw new Error(
          'Joining session failed: session or player not initialized',
        );

      joinAttempted.current = true;
      await emit(sessionWsEvent.join, { sessionID: session.id, playerID });
      joinedPlayerID.current = playerID;
    },
    [session, emit],
  );

  useEffect(() => {
    if (
      connectionStatus !== 'connected' ||
      !session ||
      !localPlayerID ||
      joinAttempted.current
    )
      return;

    join(localPlayerID).catch((error: unknown) => {
      invokeError(error, 'Une erreur est survenue');
    });
  }, [connectionStatus, session, localPlayerID, join, invokeError]);

  const requireSession = (action: string): Session => {
    if (!session) throw new Error(`${action} failed: session not initialized`);
    return session;
  };

  const requireGame = (action: string): Session => {
    const current = requireSession(action);
    if (!current.currentGame)
      throw new Error(`${action} failed: session or game not initialized`);
    return current;
  };

  const updateHost = async (newHostID: PlayerId) => {
    requireSession('Updating host');
    await emit(sessionWsEvent.updateHost, { newHostID });
  };

  const updateGameConfig = async (partialGameConfig: Partial<GameConfig>) => {
    const current = requireSession('Updating game config');
    const gameConfig = { ...current.gameConfig, ...partialGameConfig };
    await emit(sessionWsEvent.updateGameConfig, { gameConfig });
  };

  const kickPlayer = async (playerToKick: PlayerId) => {
    requireSession('Kicking player');
    await emit(sessionWsEvent.kickPlayer, { playerToKick });
  };

  const startGame = async () => {
    requireSession('Starting game');
    await emit(sessionWsEvent.startGame);
  };

  const guess = async (playerGuess: Guess) => {
    requireGame('Guess');
    await emit(sessionWsEvent.guess, { guess: playerGuess });
  };

  const nextRound = async () => {
    requireGame('Next round');
    await emit(sessionWsEvent.nextRound);
  };

  const endGame = async () => {
    const current = requireGame('Ending game');
    setSession(withStatus(current, SessionStatus.IN_LOBBY));
  };

  const playAgain = async () => {
    const current = requireGame('Playing again');
    if (!isHostOf(current, localPlayerID)) return;
    await emit(sessionWsEvent.playAgain);
  };

  const exitGame = async () => {
    navigation.returnTo('/');
  };

  return {
    session,
    isHost: isHostOf(session, localPlayerID),
    connectionStatus,
    retryConnection,
    join,
    updateHost,
    updateGameConfig,
    kickPlayer,
    startGame,
    guess,
    nextRound,
    endGame,
    playAgain,
    exitGame,
  };
}
