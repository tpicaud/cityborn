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
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Navigation } from '../../platform/navigation';
import type { SocketFactory } from '../../platform/socket';
import { useError } from '../../shared/errorContext';
import type { SessionApi } from './sessionApi';
import type { SessionController } from './sessionContract';
import { isHostOf, mergeSessionUpdate, withStatus } from './sessionState';
import { useSocket } from './useSocket';

export interface MultiSessionOptions {
  localPlayerID: PlayerId | undefined;
  sessionID: SessionId;
  sessionApi: SessionApi;
  navigation: Navigation;
  createSocket: SocketFactory;
}

export interface MultiSessionController extends SessionController {
  connected: boolean;
  hasDisconnected: boolean;
  join: (playerID: PlayerId) => Promise<void>;
  updateHost: (newHostID: PlayerId) => Promise<void>;
  kickPlayer: (playerToKick: PlayerId) => Promise<void>;
  reconnect: () => Promise<void>;
}

export function useMultiSession({
  localPlayerID,
  sessionID,
  sessionApi,
  navigation,
  createSocket,
}: MultiSessionOptions): MultiSessionController {
  const { invokeError } = useError();
  const [session, setSession] = useState<Session>();
  const [connected, setConnected] = useState(false);
  const {
    connected: socketConnected,
    hasDisconnected,
    emit,
    on,
    off,
  } = useSocket(createSocket);
  const hasJoined = useRef(false);

  useEffect(() => {
    const loadSession = async () => {
      const result = await sessionApi.fetchSession(sessionID);
      if (!result.ok) return invokeError(result.error);
      setSession(result.data);
    };
    loadSession();
  }, [sessionID, sessionApi, invokeError]);

  useEffect(() => {
    if (!socketConnected) setConnected(false);
  }, [socketConnected]);

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

      hasJoined.current = true;
      await emit(sessionWsEvent.join, { sessionID: session.id, playerID });
      setConnected(true);
    },
    [session, emit],
  );

  const reconnect = useCallback(async () => {
    if (!session || !localPlayerID)
      throw new Error('Reconnection failed: player or session not initialized');

    await emit(sessionWsEvent.reconnect, {
      sessionID: session.id,
      playerID: localPlayerID,
    });
    setConnected(true);
  }, [session, localPlayerID, emit]);

  useEffect(() => {
    if (!session || !localPlayerID || connected || !socketConnected) return;

    const joinOrReconnect = async () => {
      try {
        if (hasJoined.current) {
          if (hasDisconnected) await reconnect();
          return;
        }
        await join(localPlayerID);
      } catch (error) {
        invokeError(error, 'Une erreur est survenue');
      }
    };
    joinOrReconnect();
  }, [
    session,
    localPlayerID,
    connected,
    socketConnected,
    hasDisconnected,
    join,
    reconnect,
    invokeError,
  ]);

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
    navigation.replace('/');
  };

  return {
    session,
    isHost: isHostOf(session, localPlayerID),
    connected,
    hasDisconnected,
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
    reconnect,
  };
}
