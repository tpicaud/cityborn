'use client';

import type {
  GameConfigChanges,
  Guess,
  PlayerId,
  Session,
  SessionId,
  SessionJoinAck,
  SessionReconnectToken,
  UserId,
} from '@cityborn/api';
import {
  applyGameConfigChanges,
  GameStatus,
  SessionStatus,
} from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { invalidateGameRecords } from '../../domains/game-record/gameRecordQueries';
import type { SessionChannel } from '../../domains/session/sessionApi';
import { useSessionChannel } from '../../domains/session/useSessionChannel';
import type { Navigation } from '../../platform/navigation';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import type { WsChannelState } from '../../ws/useWsChannel';
import type { WsConnectionStatus } from '../../ws/wsConnection';
import { type CurrentUser, useCurrentUser } from '../auth/authContext';
import { requireOpenedSessionChannel } from './openedSessionChannel';
import { reportActionErrors } from './reportedAction';
import { presetPlayerID } from './sessionPlayers';
import { isHostOf, mergeSessionUpdate, withStatus } from './sessionState';

export type SessionControllerOptions = {
  sessionID: SessionId;
  navigation: Navigation;
};

export type SessionController = {
  session: Session | undefined;
  localPlayerID: PlayerId | undefined;
  isHost: boolean;
  connectionStatus: WsConnectionStatus;
  retryConnection: () => void;
  join: (playerID: PlayerId) => Promise<void>;
  updateHost: (newHostID: PlayerId) => Promise<void>;
  updateGameConfig: (changes: GameConfigChanges) => Promise<void>;
  startGame: () => Promise<void>;
  guess: (guess: Guess) => Promise<void>;
  nextRound: () => Promise<void>;
  endGame: () => Promise<void>;
  playAgain: () => Promise<void>;
  exitGame: () => Promise<void>;
};

type JoinedPlayer = {
  playerID: PlayerId;
  reconnectToken: SessionReconnectToken | undefined;
};

export function useSessionController({
  sessionID,
  navigation,
}: SessionControllerOptions): SessionController {
  const { sessionApi }: DomainApis = useDomainApis();
  const { user }: CurrentUser = useCurrentUser();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [session, setSession] = useState<Session>();
  const [joinedPlayerID, setJoinedPlayerID] = useState<PlayerId>();
  const localPlayerID: PlayerId | undefined =
    joinedPlayerID ??
    presetPlayerID({ mode: session?.mode, username: user?.username });
  const joinedPlayer: RefObject<JoinedPlayer | null> =
    useRef<JoinedPlayer | null>(null);
  const joinAttempted: RefObject<boolean> = useRef<boolean>(false);

  const restoreSession = useCallback(
    async (restoredChannel: SessionChannel) => {
      const player: JoinedPlayer | null = joinedPlayer.current;
      if (!player) return;
      await restoredChannel.reconnect({
        sessionID,
        playerID: player.playerID,
        reconnectToken: player.reconnectToken,
      });
    },
    [sessionID],
  );

  const {
    channel: sessionChannel,
    connectionStatus,
    retryConnection,
  }: WsChannelState<SessionChannel> = useSessionChannel({ restoreSession });

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
      sessionChannel?.onSessionUpdate((incoming: Session) => {
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
      const openedChannel: SessionChannel = requireOpenedSessionChannel({
        sessionChannel,
        action: 'Joining session',
      });

      joinAttempted.current = true;
      const joinAck: SessionJoinAck = await openedChannel.join({
        sessionID: session.id,
        playerID,
      });
      joinedPlayer.current = {
        playerID,
        reconnectToken: joinAck.reconnectToken,
      };
      setJoinedPlayerID(playerID);
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
    await requireOpenedSessionChannel({
      sessionChannel,
      action: 'Updating host',
    }).updateHost(newHostID);
  };

  const updateGameConfig = async (changes: GameConfigChanges) => {
    const current = requireSession('Updating game config');
    await requireOpenedSessionChannel({
      sessionChannel,
      action: 'Updating game config',
    }).updateGameConfig(
      applyGameConfigChanges({ gameConfig: current.gameConfig, changes }),
    );
  };

  const startGame = async () => {
    requireSession('Starting game');
    await requireOpenedSessionChannel({
      sessionChannel,
      action: 'Starting game',
    }).startGame();
  };

  const guess = async (playerGuess: Guess) => {
    requireGame('Guess');
    await requireOpenedSessionChannel({
      sessionChannel,
      action: 'Guess',
    }).guess(playerGuess);
  };

  const nextRound = async () => {
    requireGame('Next round');
    await requireOpenedSessionChannel({
      sessionChannel,
      action: 'Next round',
    }).nextRound();
  };

  const endGame = async () => {
    const current = requireGame('Ending game');
    setSession(withStatus(current, SessionStatus.IN_LOBBY));
  };

  const playAgain = async () => {
    const current = requireGame('Playing again');
    if (!isHostOf(current, localPlayerID)) return;
    await requireOpenedSessionChannel({
      sessionChannel,
      action: 'Playing again',
    }).playAgain();
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
