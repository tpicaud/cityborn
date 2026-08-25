import {
  type ApiError,
  type GameConfig,
  type Guess,
  isApiError,
  type Session,
  SessionStatus,
} from '@cityborn/api';
import { useError } from '@cityborn/client';
import { reconcileGuessObjects } from '@cityborn/core';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { fetchSession } from '@/server/use-server/session';
import type { IUseSession } from './IUseSession';
import { useSocket } from './useSocket';

type SocketResponse = {
  success: boolean;
  error?: { code: string; message: string; statusCode: number };
};

function socketError(err?: {
  code: string;
  message: string;
  statusCode: number;
}) {
  return {
    code: (err?.code ?? 'UNKNOWN_ERROR') as never,
    message: err?.message ?? 'Unexpected error',
    statusCode: err?.statusCode ?? 500,
  } satisfies ApiError;
}

export function useMultiSession(
  localPlayerID: string | undefined,
  sessionID: string,
): IUseSession & {
  connected: boolean;
  socket: Socket;
  hasDisconnected: boolean;
  join: (playerID: string) => Promise<void>;
  updateHost: (newHostID: string) => Promise<void>;
  kickPlayer: (playerToKick: string) => Promise<void>;
  reconnect: () => void;
} {
  const router = useRouter();
  const { invokeError } = useError();
  const [session, setSession] = useState<Session>();
  const [connected, setConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const { socket, hasDisconnected, emit, on, off } = useSocket();

  useEffect(() => {
    const load = async () => {
      const result = await fetchSession(sessionID);
      if (!result.ok) return invokeError(result.error);
      setSession(result.data);
    };
    load();
  }, [sessionID, invokeError]);

  useEffect(() => {
    if (!socket?.connected) {
      setConnected(false);
    }
  }, [socket?.connected]);

  const reconnect = useCallback(async () => {
    if (!session || !localPlayerID)
      throw new Error('Reconnection failed: player or session not initialized');
    try {
      return new Promise<void>((resolve, reject) => {
        emit(
          'session:reconnect',
          { sessionID: session.id, playerID: localPlayerID },
          (response: SocketResponse) => {
            if (response.success) {
              setConnected(true);
              resolve();
            } else {
              reject(socketError(response.error));
            }
          },
        );
      });
    } catch (error) {
      throw new Error(`Non connecté au serveur: ${error}`);
    }
  }, [session, localPlayerID, emit]);

  useEffect(() => {
    const autoReconnect = async () => {
      try {
        if (socket.connected && hasDisconnected && !connected) {
          await reconnect();
        }
      } catch (error: unknown) {
        invokeError(isApiError(error) ? error : 'Une erreur est survenue');
      }
    };
    autoReconnect();
  }, [socket.connected, hasDisconnected, connected, invokeError, reconnect]);

  useEffect(() => {
    if (session) {
      setIsHost(session.hostID === localPlayerID);
    }
  }, [localPlayerID, session]);

  useEffect(() => {
    const handleSessionUpdate = (s: Session) => {
      setSession((prev) => ({
        ...s,
        currentGame: reconcileGuessObjects(prev?.currentGame, s.currentGame),
      }));
    };

    on('session:update', handleSessionUpdate);
    on('connection_error', () => {});
    return () => {
      off('session:update', handleSessionUpdate);
    };
  }, [on, off]);

  const join = useCallback(
    async (playerID: string) => {
      if (!session || !playerID)
        throw new Error(
          'Joining session failed: session or player not initialized',
        );
      return new Promise<void>((resolve, reject) => {
        emit(
          'session:join',
          { sessionID: session.id, playerID },
          (response: SocketResponse) => {
            if (response.success) {
              setConnected(true);
              resolve();
            } else reject(socketError(response.error));
          },
        );
      });
    },
    [session, emit],
  );

  const updateHost = async (newHostID: string) => {
    if (!session)
      throw new Error('Updating host failed: session not initialized');
    return new Promise<void>((resolve, reject) => {
      emit('session:updateHost', { newHostID }, (response: SocketResponse) => {
        if (response.success) resolve();
        else reject(socketError(response.error));
      });
    });
  };

  const updateGameConfig = async (partialGameConfig: Partial<GameConfig>) => {
    if (!session)
      throw new Error('Updating game config failed: session not initialized');
    const gameConfig = { ...session.gameConfig, ...partialGameConfig };
    return new Promise<void>((resolve, reject) => {
      emit(
        'session:updateGameConfig',
        { gameConfig },
        (response: SocketResponse) => {
          if (response.success) resolve();
          else reject(socketError(response.error));
        },
      );
    });
  };

  const kickPlayer = async (playerToKick: string) => {
    if (!session)
      throw new Error('Kicking player failed: session not initialized');
    return new Promise<void>((resolve, reject) => {
      emit(
        'session:kickPlayer',
        { playerToKick },
        (response: SocketResponse) => {
          if (response.success) resolve();
          else reject(socketError(response.error));
        },
      );
    });
  };

  const startGame = async () => {
    if (!session)
      throw new Error('Starting game failed: session not initialized');
    return new Promise<void>((resolve, reject) => {
      emit('session:startGame', (response: SocketResponse) => {
        if (response.success) resolve();
        else reject(socketError(response.error));
      });
    });
  };

  const guess = async (g: Guess) => {
    if (!session?.currentGame)
      throw new Error('Guess failed: session or game not initialized');
    return new Promise<void>((resolve, reject) => {
      emit('session:guess', { guess: g }, (response: SocketResponse) => {
        if (response.success) resolve();
        else reject(socketError(response.error));
      });
    });
  };

  const nextRound = async () => {
    if (!session?.currentGame)
      throw new Error('Next round failed: session or game not initialized');
    return new Promise<void>((resolve, reject) => {
      emit('session:nextRound', (response: SocketResponse) => {
        if (response.success) resolve();
        else reject(socketError(response.error));
      });
    });
  };

  const endGame = async () => {
    if (!session?.currentGame)
      throw new Error('Ending game failed: session or game not initialized');
    setSession({ ...session, status: SessionStatus.IN_LOBBY });
  };

  const exitGame = async () => {
    router.push('/');
  };

  const playAgain = async () => {
    if (!session?.currentGame)
      throw new Error('Ending game failed: session or game not initialized');
    if (!isHost) return;
    return new Promise<void>((resolve, reject) => {
      emit('session:playAgain', (response: SocketResponse) => {
        if (response.success) resolve();
        else reject(socketError(response.error));
      });
    });
  };

  return {
    session,
    connected,
    socket,
    isHost,
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
