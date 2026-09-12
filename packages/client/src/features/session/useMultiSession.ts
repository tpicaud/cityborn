'use client';

import type { GameConfig, Guess, Session } from '@cityborn/api';
import { SessionStatus } from '@cityborn/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Navigation } from '../../platform/navigation';
import type { SocketFactory } from '../../platform/socket';
import { useError } from '../../shared/errorContext';
import type { SessionApi } from './sessionApi';
import { isHostOf, mergeSessionUpdate, withStatus } from './sessionState';
import { emitWithAck } from './socketRequest';
import type { IUseSession } from './useSession';
import { useSocket } from './useSocket';

export interface MultiSessionOptions {
  localPlayerID: string | undefined;
  sessionID: string;
  sessionApi: SessionApi;
  navigation: Navigation;
  createSocket: SocketFactory;
}

export interface MultiSession extends IUseSession {
  connected: boolean;
  hasDisconnected: boolean;
  join: (playerID: string) => Promise<void>;
  updateHost: (newHostID: string) => Promise<void>;
  kickPlayer: (playerToKick: string) => Promise<void>;
  reconnect: () => Promise<void>;
}

export function useMultiSession({
  localPlayerID,
  sessionID,
  sessionApi,
  navigation,
  createSocket,
}: MultiSessionOptions): MultiSession {
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

    on('session:update', handleSessionUpdate);
    return () => off('session:update', handleSessionUpdate);
  }, [on, off]);

  const join = useCallback(
    async (playerID: string) => {
      if (!session || !playerID)
        throw new Error(
          'Joining session failed: session or player not initialized',
        );

      hasJoined.current = true;
      await emitWithAck(emit, 'session:join', {
        sessionID: session.id,
        playerID,
      });
      setConnected(true);
    },
    [session, emit],
  );

  const reconnect = useCallback(async () => {
    if (!session || !localPlayerID)
      throw new Error('Reconnection failed: player or session not initialized');

    await emitWithAck(emit, 'session:reconnect', {
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

  const updateHost = async (newHostID: string) => {
    requireSession('Updating host');
    await emitWithAck(emit, 'session:updateHost', { newHostID });
  };

  const updateGameConfig = async (partialGameConfig: Partial<GameConfig>) => {
    const current = requireSession('Updating game config');
    const gameConfig = { ...current.gameConfig, ...partialGameConfig };
    await emitWithAck(emit, 'session:updateGameConfig', { gameConfig });
  };

  const kickPlayer = async (playerToKick: string) => {
    requireSession('Kicking player');
    await emitWithAck(emit, 'session:kickPlayer', { playerToKick });
  };

  const startGame = async () => {
    requireSession('Starting game');
    await emitWithAck(emit, 'session:startGame');
  };

  const guess = async (playerGuess: Guess) => {
    requireGame('Guess');
    await emitWithAck(emit, 'session:guess', { guess: playerGuess });
  };

  const nextRound = async () => {
    requireGame('Next round');
    await emitWithAck(emit, 'session:nextRound');
  };

  const endGame = async () => {
    const current = requireGame('Ending game');
    setSession(withStatus(current, SessionStatus.IN_LOBBY));
  };

  const playAgain = async () => {
    const current = requireGame('Playing again');
    if (!isHostOf(current, localPlayerID)) return;
    await emitWithAck(emit, 'session:playAgain');
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
