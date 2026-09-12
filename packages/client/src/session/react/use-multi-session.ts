'use client';

import {
  type GameConfig,
  type Guess,
  type Session,
  SessionStatus,
} from '@cityborn/api';
import { reconcileGuessObjects } from '@cityborn/core';
import { useCallback, useEffect, useState } from 'react';
import { useError } from '../../infrastructure/react/error-context';
import type { SessionGateway } from '../../ports/gateways';
import type { SessionNavigation } from '../../ports/navigation';
import type { SocketConnectionFactory } from '../../ports/socket';
import type { MultiSessionController } from '../session-controller';
import {
  emitSessionEvent,
  SESSION_UPDATE_EVENT,
} from '../session-socket-protocol';
import { useSessionSocket } from './use-session-socket';

export interface MultiSessionDependencies {
  sessionGateway: SessionGateway;
  connectSocket: SocketConnectionFactory;
  navigation: SessionNavigation;
}

export function useMultiSession(
  localPlayerID: string | undefined,
  sessionID: string,
  { sessionGateway, connectSocket, navigation }: MultiSessionDependencies,
): MultiSessionController {
  const { invokeError } = useError();
  const [session, setSession] = useState<Session>();
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const { isSocketConnected, hasDisconnected, emit, on, off } =
    useSessionSocket(connectSocket);

  useEffect(() => {
    const loadSession = async () => {
      const result = await sessionGateway.fetchSession(sessionID);
      if (!result.ok) return invokeError(result.error);
      setSession(result.data);
    };
    loadSession();
  }, [sessionID, sessionGateway, invokeError]);

  useEffect(() => {
    if (!isSocketConnected) {
      setIsJoined(false);
    }
  }, [isSocketConnected]);

  useEffect(() => {
    setIsHost(session?.hostID === localPlayerID);
  }, [localPlayerID, session?.hostID]);

  useEffect(() => {
    const handleSessionUpdate = (updatedSession: Session) => {
      setSession((previousSession) => ({
        ...updatedSession,
        currentGame: reconcileGuessObjects(
          previousSession?.currentGame,
          updatedSession.currentGame,
        ),
      }));
    };

    on(SESSION_UPDATE_EVENT, handleSessionUpdate);
    return () => off(SESSION_UPDATE_EVENT, handleSessionUpdate);
  }, [on, off]);

  const join = useCallback(
    async (playerID: string) => {
      if (!session || !playerID) {
        throw new Error(
          'Joining session failed: session or player not initialized',
        );
      }
      await emitSessionEvent({ emit }, 'session:join', {
        sessionID: session.id,
        playerID,
      });
      setIsJoined(true);
    },
    [session, emit],
  );

  const reconnect = useCallback(async () => {
    if (!session || !localPlayerID) {
      throw new Error('Reconnection failed: player or session not initialized');
    }
    await emitSessionEvent({ emit }, 'session:reconnect', {
      sessionID: session.id,
      playerID: localPlayerID,
    });
    setIsJoined(true);
  }, [session, localPlayerID, emit]);

  useEffect(() => {
    const autoReconnect = async () => {
      if (!isSocketConnected || !hasDisconnected || isJoined) return;
      try {
        await reconnect();
      } catch (error) {
        invokeError(error, 'La reconnexion à la session a échoué');
      }
    };
    autoReconnect();
  }, [isSocketConnected, hasDisconnected, isJoined, invokeError, reconnect]);

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

  const updateHost = async (newHostID: string) => {
    if (!session) {
      throw new Error('Updating host failed: session not initialized');
    }
    await emitSessionEvent({ emit }, 'session:updateHost', { newHostID });
  };

  const updateGameConfig = (partialGameConfig: Partial<GameConfig>) =>
    runCommand(async () => {
      if (!session) {
        throw new Error('Updating game config failed: session not initialized');
      }
      await emitSessionEvent({ emit }, 'session:updateGameConfig', {
        gameConfig: { ...session.gameConfig, ...partialGameConfig },
      });
    });

  const kickPlayer = async (playerToKick: string) => {
    if (!session) {
      throw new Error('Kicking player failed: session not initialized');
    }
    await emitSessionEvent({ emit }, 'session:kickPlayer', { playerToKick });
  };

  const startGame = () =>
    runCommand(async () => {
      if (!session) {
        throw new Error('Starting game failed: session not initialized');
      }
      await emitSessionEvent({ emit }, 'session:startGame');
    });

  const guess = (newGuess: Guess) =>
    runCommand(async () => {
      if (!session?.currentGame) {
        throw new Error('Guess failed: session or game not initialized');
      }
      await emitSessionEvent({ emit }, 'session:guess', { guess: newGuess });
    });

  const nextRound = () =>
    runCommand(async () => {
      if (!session?.currentGame) {
        throw new Error('Next round failed: session or game not initialized');
      }
      await emitSessionEvent({ emit }, 'session:nextRound');
    });

  const endGame = () =>
    runCommand(async () => {
      if (!session?.currentGame) {
        throw new Error('Ending game failed: session or game not initialized');
      }
      setSession({ ...session, status: SessionStatus.IN_LOBBY });
    });

  const playAgain = () =>
    runCommand(async () => {
      if (!session?.currentGame) {
        throw new Error(
          'Playing again failed: session or game not initialized',
        );
      }
      if (!isHost) return;
      await emitSessionEvent({ emit }, 'session:playAgain');
    });

  const exitGame = async () => {
    navigation.goHome();
  };

  return {
    session,
    isHost,
    isSocketConnected,
    isJoined,
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
