import {
  type GameConfig,
  type Guess,
  type Session,
  SessionStatus,
} from '@cityborn/api';
import { ApiError } from '@cityborn/errors';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useError } from '@/contexts/ErrorContext';
import { fetchSession } from '@/server/actions/session';
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
  return new ApiError(
    (err?.code ?? 'UNKNOWN_ERROR') as never,
    err?.message ?? 'Unexpected error',
    err?.statusCode ?? 500,
  );
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

  // Fetch session on init
  useEffect(() => {
    const load = async () => {
      try {
        const s = await fetchSession(sessionID);
        setSession(s);
      } catch (error: unknown) {
        invokeError(error);
      }
    };
    load();
  }, [sessionID, invokeError]);

  // Manage socket disconnection
  useEffect(() => {
    if (!socket?.connected) {
      setConnected(false);
    }
  }, [socket?.connected]);

  const reconnect = useCallback(async () => {
    if (!session || !localPlayerID)
      throw new Error('Reconnection failed: player or session not initialized');
    try {
      console.log('Reconnecting player to session...');
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

  // Manage automatic reconnect
  useEffect(() => {
    const autoReconnect = async () => {
      try {
        if (socket.connected && hasDisconnected && !connected) {
          await reconnect();
        }
      } catch (error: unknown) {
        invokeError(error);
      }
    };
    autoReconnect();
  }, [socket.connected, hasDisconnected, connected, invokeError, reconnect]);

  // Manage host
  useEffect(() => {
    if (session) {
      setIsHost(session.hostID === localPlayerID);
    }
  }, [localPlayerID, session]);

  // Handle socket listener
  useEffect(() => {
    const handleSessionUpdate = (s: Session) => {
      console.log('Session update: ', s);
      setSession((prev) => {
        const prevGuessObjects = prev?.currentGame?.state?.guessObjects;
        const newGuessObjects = s.currentGame?.state?.guessObjects;
        return {
          ...s,
          currentGame: s.currentGame
            ? {
                ...s.currentGame,
                state: {
                  ...s.currentGame.state,
                  guessObjects: newGuessObjects ?? prevGuessObjects,
                },
              }
            : undefined,
        };
      });
    };

    on('session:update', handleSessionUpdate);
    on('connection_error', (error: unknown) => {
      console.log(error);
    });
    return () => {
      off('session:update', handleSessionUpdate);
    };
  }, [on, off]);

  const join = async (playerID: string) => {
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
  };

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
