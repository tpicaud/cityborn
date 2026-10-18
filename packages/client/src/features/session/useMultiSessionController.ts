'use client';

import type {
  GameConfig,
  Guess,
  PlayerId,
  Session,
  SessionId,
  SessionJoinAck,
  SessionReconnectToken,
  UserId,
} from '@cityborn/api';
import { GameStatus, SessionStatus } from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { invalidateGameRecords } from '../../domains/game-record/gameRecordQueries';
import {
  createSessionChannel,
  type SessionChannel,
} from '../../domains/session/sessionApi';
import type { Navigation } from '../../platform/navigation';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import type { SocketConnection } from '../../ws/socketConnection';
import type { SocketFactory } from '../../ws/socketFactory';
import type { WsConnectionStatus } from '../../ws/wsConnection';
import { type CurrentUser, useCurrentUser } from '../auth/authContext';
import { reportActionErrors } from './reportedAction';
import type { SessionController } from './sessionContract';
import { isHostOf, mergeSessionUpdate, withStatus } from './sessionState';
import { useSocket } from './useSocket';

export type MultiSessionControllerOptions = {
  sessionID: SessionId;
  navigation: Navigation;
  createSocket: SocketFactory;
};

export type MultiSessionController = SessionController & {
  connectionStatus: WsConnectionStatus;
  retryConnection: () => void;
  join: (playerID: PlayerId) => Promise<void>;
  updateHost: (newHostID: PlayerId) => Promise<void>;
};

type JoinedPlayer = {
  playerID: PlayerId;
  reconnectToken: SessionReconnectToken | undefined;
};

export function useMultiSessionController({
  sessionID,
  navigation,
  createSocket,
}: MultiSessionControllerOptions): MultiSessionController {
  const { sessionApi }: DomainApis = useDomainApis();
  const { user }: CurrentUser = useCurrentUser();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [localPlayerID, setLocalPlayerID] = useState<PlayerId | undefined>(
    user?.username,
  );
  const [session, setSession] = useState<Session>();
  const joinedPlayer: RefObject<JoinedPlayer | null> =
    useRef<JoinedPlayer | null>(null);
  const joinAttempted: RefObject<boolean> = useRef<boolean>(false);

  const restoreSession = useCallback(
    async (socket: SocketConnection) => {
      const player: JoinedPlayer | null = joinedPlayer.current;
      if (!player) return;
      await createSessionChannel(socket).reconnect({
        sessionID,
        playerID: player.playerID,
        reconnectToken: player.reconnectToken,
      });
    },
    [sessionID],
  );

  const { connectionStatus, retryConnection, socket } = useSocket({
    createSocket,
    restoreSession,
  });
  const sessionChannel: SessionChannel = useMemo<SessionChannel>(
    () => createSessionChannel(socket),
    [socket],
  );

  useEffect(() => {
    const loadSession = async (): Promise<void> => {
      try {
        setSession(await sessionApi.fetchSession(sessionID));
      } catch (error: unknown) {
        reportError(error);
        navigation.returnTo('/');
      }
    };
    loadSession();
  }, [sessionID, sessionApi, navigation, reportError]);

  const gameStatus: GameStatus | undefined = session?.currentGame?.status;
  const userId: UserId | undefined = user?.id;

  useEffect(() => {
    if (gameStatus !== GameStatus.IN_RESULTS || !userId) return;
    invalidateGameRecords({ queryClient, userId });
  }, [gameStatus, userId, queryClient]);

  useEffect(
    () =>
      sessionChannel.onSessionUpdate((incoming: Session) => {
        setSession((previous) => mergeSessionUpdate(previous, incoming));
      }),
    [sessionChannel],
  );

  const join = useCallback(
    async (playerID: PlayerId) => {
      if (!session || !playerID)
        throw new Error(
          'Joining session failed: session or player not initialized',
        );

      joinAttempted.current = true;
      const joinAck: SessionJoinAck = await sessionChannel.join({
        sessionID: session.id,
        playerID,
      });
      joinedPlayer.current = {
        playerID,
        reconnectToken: joinAck.reconnectToken,
      };
      setLocalPlayerID(playerID);
    },
    [session, sessionChannel],
  );

  useEffect(() => {
    if (
      connectionStatus !== 'connected' ||
      !session ||
      !localPlayerID ||
      joinAttempted.current
    )
      return;

    join(localPlayerID).catch(reportError);
  }, [connectionStatus, session, localPlayerID, join, reportError]);

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
    await sessionChannel.updateHost(newHostID);
  };

  const updateGameConfig = async (partialGameConfig: Partial<GameConfig>) => {
    const current = requireSession('Updating game config');
    await sessionChannel.updateGameConfig({
      ...current.gameConfig,
      ...partialGameConfig,
    });
  };

  const startGame = async () => {
    requireSession('Starting game');
    await sessionChannel.startGame();
  };

  const guess = async (playerGuess: Guess) => {
    requireGame('Guess');
    await sessionChannel.guess(playerGuess);
  };

  const nextRound = async () => {
    requireGame('Next round');
    await sessionChannel.nextRound();
  };

  const endGame = async () => {
    const current = requireGame('Ending game');
    setSession(withStatus(current, SessionStatus.IN_LOBBY));
  };

  const playAgain = async () => {
    const current = requireGame('Playing again');
    if (!isHostOf(current, localPlayerID)) return;
    await sessionChannel.playAgain();
  };

  const exitGame = async () => {
    navigation.returnTo('/');
  };

  return {
    session,
    localPlayerID,
    isHost: isHostOf(session, localPlayerID),
    connectionStatus,
    retryConnection,
    join: reportActionErrors({ action: join, reportError }),
    updateHost: reportActionErrors({ action: updateHost, reportError }),
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
