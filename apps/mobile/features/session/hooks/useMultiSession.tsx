import {
  type ApiError,
  type GameConfig,
  type Guess,
  isApiError,
  type Session,
  SessionStatus,
} from '@cityborn/api';
import { useError } from '@cityborn/client';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { fetchSession } from '@/lib/api/session';
import type { IUseSession } from './IUseSession';
import { useSocket } from './useSocket';

type SessionAck = { success: true } | { success: false; error: ApiError };

export function useMultiSession(
  localPlayerID: string | undefined,
  sessionID: string,
): IUseSession & {
  connected: boolean;
  socket: Socket | null;
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

  //////////////////////////
  // Connection functions //
  //////////////////////////

  const reconnect = useCallback(async () => {
    if (!session || !localPlayerID)
      throw new Error('Reconnection failed: player or session not initialized');

    try {
      console.log('Reconnecting player to session...');
      const sessionID = session.id;
      return new Promise<void>((resolve, reject) => {
        const body = { sessionID, playerID: localPlayerID };
        emit('session:reconnect', body, (response: SessionAck) => {
          if (response.success) {
            setConnected(true);
            resolve();
          } else {
            reject({
              code: response.error.code,
              message: response.error.message,
              statusCode: response.error.statusCode,
            });
          }
        });
      });
    } catch (error) {
      throw new Error(`Non connecté au serveur: ${error}`);
    }
  }, [session, localPlayerID, emit]);

  /////////////////
  // useEffects //
  ////////////////

  useEffect(() => {
    const loadSession = async () => {
      const result = await fetchSession(sessionID);
      if (!result.ok) return invokeError(result.error);
      setSession(result.data);
    };
    loadSession();
  }, [invokeError, sessionID]);

  useEffect(() => {
    if (!socket?.connected) {
      setConnected(false);
    }
  }, [socket?.connected]);

  useEffect(() => {
    const autoReconnect = async () => {
      try {
        if (socket?.connected && hasDisconnected && !connected) {
          await reconnect();
        }
      } catch (error) {
        invokeError(isApiError(error) ? error : String(error));
      }
    };
    autoReconnect();
  }, [socket, hasDisconnected, connected, invokeError, reconnect]);

  useEffect(() => {
    if (session) {
      setIsHost(session?.hostID === localPlayerID);
    }
  }, [localPlayerID, session?.hostID, session]);

  useEffect(() => {
    if (!socket) return;

    const handleSessionUpdate = (session: Session) => {
      setSession((prevSession) => {
        const prevGuessObjects = prevSession?.currentGame?.state?.guessObjects;
        const newGuessObjects = session.currentGame?.state?.guessObjects;

        return {
          ...session,
          currentGame: session.currentGame
            ? {
                ...session.currentGame,
                state: {
                  ...session.currentGame.state,
                  guessObjects: newGuessObjects ?? prevGuessObjects,
                },
              }
            : undefined,
        };
      });
    };

    on('session:update', handleSessionUpdate);
    on('connection_error', (error) => {
      console.log(error);
    });

    return () => {
      off('session:update', handleSessionUpdate);
    };
  }, [socket, on, off]);

  ///////////////////////
  // Session functions //
  ///////////////////////

  const join = async (playerID: string) => {
    if (!session || !playerID)
      throw new Error(
        'Joining session failed: session of player not initialized',
      );

    const sessionID = session.id;
    return new Promise<void>((resolve, reject) => {
      const body = { sessionID, playerID };
      emit('session:join', body, (response: SessionAck) => {
        if (response.success) {
          setConnected(true);
          resolve();
        } else {
          reject({
            code: response.error.code,
            message: response.error.message,
            statusCode: response.error.statusCode,
          });
        }
      });
    });
  };

  const updateHost = async (newHostID: string) => {
    if (!session)
      throw new Error('Updating host failed: session not initialized');

    return new Promise<void>((resolve, reject) => {
      const body = { newHostID };
      emit('session:updateHost', body, (response: SessionAck) => {
        if (response.success) {
          resolve();
        } else {
          reject({
            code: response.error.code,
            message: response.error.message,
            statusCode: response.error.statusCode,
          });
        }
      });
    });
  };

  const updateGameConfig = async (partialGameConfig: Partial<GameConfig>) => {
    if (!session)
      throw new Error('Updating game config failed: session not initialized');

    const gameConfig = { ...session.gameConfig, ...partialGameConfig };
    const body = { gameConfig };
    return new Promise<void>((resolve, reject) => {
      emit('session:updateGameConfig', body, (response: SessionAck) => {
        if (response.success) {
          resolve();
        } else {
          reject({
            code: response.error.code,
            message: response.error.message,
            statusCode: response.error.statusCode,
          });
        }
      });
    });
  };

  const kickPlayer = async (playerToKick: string) => {
    if (!session)
      throw new Error('Kicking player failed: session not initialized');

    const body = { playerToKick };
    return new Promise<void>((resolve, reject) => {
      emit('session:kickPlayer', body, (response: SessionAck) => {
        if (response.success) {
          resolve();
        } else {
          reject({
            code: response.error.code,
            message: response.error.message,
            statusCode: response.error.statusCode,
          });
        }
      });
    });
  };

  ////////////////////
  // Game functions //
  ////////////////////

  const startGame = async () => {
    if (!session)
      throw new Error('Starting game failed: session not initialized');

    return new Promise<void>((resolve, reject) => {
      emit('session:startGame', (response: SessionAck) => {
        if (response.success) {
          resolve();
        } else {
          reject({
            code: response.error.code,
            message: response.error.message,
            statusCode: response.error.statusCode,
          });
        }
      });
    });
  };

  const guess = async (guess: Guess) => {
    if (!session?.currentGame)
      throw new Error('Guess failed: session or game not initialized');

    return new Promise<void>((resolve, reject) => {
      const body = { guess };
      emit('session:guess', body, (response: SessionAck) => {
        if (response.success) {
          resolve();
        } else {
          reject({
            code: response.error.code,
            message: response.error.message,
            statusCode: response.error.statusCode,
          });
        }
      });
    });
  };

  const nextRound = async () => {
    if (!session?.currentGame)
      throw new Error(
        'Next round game failed: session or game not initialized',
      );

    return new Promise<void>((resolve, reject) => {
      emit('session:nextRound', (response: SessionAck) => {
        if (response.success) {
          resolve();
        } else {
          reject({
            code: response.error.code,
            message: response.error.message,
            statusCode: response.error.statusCode,
          });
        }
      });
    });
  };

  const endGame = async () => {
    if (!session?.currentGame)
      throw new Error('Ending game failed: session or game not initialized');
    setSession({ ...session, status: SessionStatus.IN_LOBBY });
  };

  const exitGame = async () => {
    router.replace('/');
  };

  const playAgain = async () => {
    if (!session?.currentGame)
      throw new Error('Ending game failed: session or game not initialized');

    if (isHost) {
      return new Promise<void>((resolve, reject) => {
        emit('session:playAgain', (response: SessionAck) => {
          if (response.success) {
            resolve();
          } else {
            reject({
              code: response.error.code,
              message: response.error.message,
              statusCode: response.error.statusCode,
            });
          }
        });
      });
    }
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
