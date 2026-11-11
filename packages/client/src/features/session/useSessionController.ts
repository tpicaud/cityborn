'use client';

import type {
  Coord,
  GameConfigPack,
  Pack,
  PackId,
  PlayerId,
  Session,
  SessionId,
  SessionJoinAck,
  SessionReconnectToken,
  UserId,
} from '@cityborn/api';
import {
  applyGameConfigChanges,
  ErrorCode,
  GameStatus,
  getFriendlyErrorMessage,
  SessionMode,
  SessionStatus,
  type sessionWsChannel,
  sessionWsEvent,
  sessionWsServerEvent,
  UserFacingError,
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
import { publishedPacksQueryOptions } from '../../domains/pack/packQueries';
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
import { createGuessSubmission } from './guessSubmission';
import { requireOpenedSessionChannel } from './openedSessionChannel';
import { reportActionErrors } from './reportedAction';
import { presetPlayerID } from './sessionPlayers';
import { isHostOf, withStatus } from './sessionState';
import { usePlayerDepartures } from './usePlayerDepartures';

export type SessionControllerOptions = {
  sessionID: SessionId;
  navigation: Navigation;
  launchedPackId?: PackId;
};

export type SessionController = {
  session: Session | undefined;
  localPlayerID: PlayerId | undefined;
  isHost: boolean;
  isLaunchingGame: boolean;
  connectionStatus: WsConnectionStatus;
  retryConnection: () => void;
  join: (playerID: PlayerId) => Promise<void>;
  updateHost: (newHostID: PlayerId) => Promise<void>;
  playPack: (pack: Pack) => Promise<void>;
  guess: (coordinates: Coord | undefined) => Promise<void>;
  nextRound: () => Promise<void>;
  endGame: () => Promise<void>;
  playAgain: () => Promise<void>;
  exitGame: () => Promise<void>;
  leaveGame: () => Promise<void>;
  departedPlayerIDs: PlayerId[];
};

type JoinedPlayer = {
  playerID: PlayerId;
  reconnectToken: SessionReconnectToken | undefined;
};

function toGameConfigPack(pack: Pack): GameConfigPack {
  return {
    id: pack.id,
    name: pack.name,
    isPublished: pack.isPublished,
    description: pack.description,
  };
}

export async function enterSession({
  session,
  playerID,
  launchedPackId,
  join,
  startGame,
  playLaunchedPack,
}: {
  session: Pick<Session, 'quickPlay'>;
  playerID: PlayerId;
  launchedPackId: PackId | undefined;
  join: (playerID: PlayerId) => Promise<void>;
  startGame: () => Promise<void>;
  playLaunchedPack: (packId: PackId) => Promise<void>;
}): Promise<void> {
  await join(playerID);
  if (launchedPackId !== undefined) return playLaunchedPack(launchedPackId);
  if (session.quickPlay) await startGame();
}

export function useSessionController({
  sessionID,
  navigation,
  launchedPackId,
}: SessionControllerOptions): SessionController {
  const { sessionApi, packApi }: DomainApis = useDomainApis();
  const { user }: CurrentUser = useCurrentUser();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [session, setSession] = useState<Session>();
  const [joinedPlayerID, setJoinedPlayerID] = useState<PlayerId>();
  const [isLaunchPending, setIsLaunchPending] = useState<boolean>(true);
  const localPlayerID: PlayerId | undefined =
    joinedPlayerID ??
    presetPlayerID({ mode: session?.mode, username: user?.username });
  const joinedPlayer: RefObject<JoinedPlayer | null> =
    useRef<JoinedPlayer | null>(null);
  const joinAttempted: RefObject<boolean> = useRef<boolean>(false);
  const departedPlayerIDs: PlayerId[] = usePlayerDepartures(session?.players);

  const restoreSession = useCallback(
    async (restoredChannel: SessionChannel) => {
      const player: JoinedPlayer | null = joinedPlayer.current;
      if (!player) return;
      await restoredChannel.emit(sessionWsEvent.reconnect, {
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
  }: WsChannelState<typeof sessionWsChannel> = useSessionChannel({
    restoreSession,
  });

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
      sessionChannel?.on(sessionWsServerEvent.update, (incoming: Session) => {
        setSession(incoming);
      }),
    [sessionChannel],
  );

  const emit: SessionChannel['emit'] = useCallback(
    (event, ...payload) =>
      requireOpenedSessionChannel({ sessionChannel, event }).emit(
        event,
        ...payload,
      ),
    [sessionChannel],
  );

  const join = useCallback(
    async (playerID: PlayerId) => {
      if (!session || !playerID)
        throw new Error(
          'Joining session failed: session or player not initialized',
        );
      joinAttempted.current = true;
      const joinAck: SessionJoinAck = await emit(sessionWsEvent.join, {
        sessionID: session.id,
        playerID,
      });
      joinedPlayer.current = {
        playerID,
        reconnectToken: joinAck.reconnectToken,
      };
      setJoinedPlayerID(playerID);
    },
    [session, emit],
  );

  const startGame: () => Promise<void> = useCallback(async () => {
    await emit(sessionWsEvent.startGame);
  }, [emit]);

  const playPack: SessionController['playPack'] = useCallback(
    async (pack: Pack) => {
      if (!session)
        throw new Error('Playing pack failed: session not initialized');
      await emit(sessionWsEvent.updateGameConfig, {
        gameConfig: applyGameConfigChanges({
          gameConfig: session.gameConfig,
          changes: { packs: [toGameConfigPack(pack)] },
        }),
      });
      await startGame();
    },
    [session, emit, startGame],
  );

  const playLaunchedPack: (packId: PackId) => Promise<void> = useCallback(
    async (packId: PackId) => {
      const packs: Pack[] = await queryClient.query(
        publishedPacksQueryOptions(packApi),
      );
      const pack: Pack | undefined = packs.find(
        (publishedPack: Pack) => publishedPack.id === packId,
      );
      if (!pack)
        throw new UserFacingError(
          getFriendlyErrorMessage({ code: ErrorCode.PACK_NOT_FOUND }),
        );
      await playPack(pack);
    },
    [queryClient, packApi, playPack],
  );

  useEffect(() => {
    if (
      connectionStatus !== 'connected' ||
      !session ||
      !localPlayerID ||
      joinAttempted.current
    )
      return;

    enterSession({
      session,
      playerID: localPlayerID,
      launchedPackId,
      join,
      startGame,
      playLaunchedPack,
    })
      .catch((error: unknown) => {
        reportError(error);
        if (session.mode === SessionMode.SOLO) navigation.returnTo('/');
      })
      .finally(() => setIsLaunchPending(false));
  }, [
    connectionStatus,
    session,
    localPlayerID,
    launchedPackId,
    join,
    startGame,
    playLaunchedPack,
    reportError,
    navigation,
  ]);

  const requireSession = (operation: string): Session => {
    if (!session)
      throw new Error(`${operation} failed: session not initialized`);
    return session;
  };

  const requireGame = (operation: string): Session => {
    const current = requireSession(operation);
    if (!current.currentGame)
      throw new Error(`${operation} failed: session or game not initialized`);
    return current;
  };

  const updateHost = async (newHostID: PlayerId) => {
    await emit(sessionWsEvent.updateHost, { newHostID });
  };

  const guess = async (coordinates: Coord | undefined) => {
    await emit(sessionWsEvent.submitGuess, {
      guess: createGuessSubmission(coordinates),
    });
  };

  const nextRound = async () => {
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

  const leaveGame: () => Promise<void> = async () => {
    await emit(sessionWsEvent.leaveGame);
    joinedPlayer.current = null;
    navigation.returnTo('/');
  };

  return {
    session,
    localPlayerID,
    isHost: isHostOf(session, localPlayerID),
    isLaunchingGame:
      isLaunchPending &&
      (session?.quickPlay === true || launchedPackId !== undefined),
    connectionStatus,
    retryConnection,
    join: reportActionErrors({ action: join, reportError }),
    updateHost: reportActionErrors({ action: updateHost, reportError }),
    playPack: reportActionErrors({ action: playPack, reportError }),
    guess: reportActionErrors({ action: guess, reportError }),
    nextRound: reportActionErrors({ action: nextRound, reportError }),
    endGame: reportActionErrors({ action: endGame, reportError }),
    playAgain: reportActionErrors({ action: playAgain, reportError }),
    exitGame: reportActionErrors({ action: exitGame, reportError }),
    leaveGame: reportActionErrors({ action: leaveGame, reportError }),
    departedPlayerIDs,
  };
}
