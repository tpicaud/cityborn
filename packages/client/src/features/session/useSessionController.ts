'use client';

import type {
  Coord,
  GameConfigChanges,
  PlayerId,
  Session,
  SessionId,
  UserId,
} from '@cityborn/api';
import {
  applyGameConfigChanges,
  GameStatus,
  SessionMode,
  SessionStatus,
  type sessionWsChannel,
  sessionWsEvent,
  sessionWsServerEvent,
} from '@cityborn/api';
import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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
import {
  admitSessionPlayer,
  createSessionAdmissionDecision,
  isSessionEntryRejected,
  type JoinedSessionPlayer,
  type SessionAdmission,
  type SessionAdmissionDecision,
} from './admission/sessionAdmission';
import { sessionAdmissionQueryOptions } from './admission/sessionAdmissionQuery';
import { createGuessSubmission } from './guessSubmission';
import { requireOpenedSessionChannel } from './openedSessionChannel';
import { reportActionErrors } from './reportedAction';
import { presetPlayerID } from './sessionPlayers';
import { isHostOf, withStatus } from './sessionState';
import { usePlayerDepartures } from './usePlayerDepartures';

export type SessionControllerOptions = {
  sessionID: SessionId;
  navigation: Navigation;
};

export type SessionController = {
  session: Session | undefined;
  sessionReceivedAt: number | undefined;
  localPlayerID: PlayerId | undefined;
  isAdmitting: boolean;
  isHost: boolean;
  isLaunchingQuickPlay: boolean;
  connectionStatus: WsConnectionStatus;
  retryConnection: () => void;
  join: (playerID: PlayerId) => Promise<void>;
  updateHost: (newHostID: PlayerId) => Promise<void>;
  updateGameConfig: (changes: GameConfigChanges) => Promise<void>;
  startGame: () => Promise<void>;
  guess: (coordinates: Coord | undefined) => Promise<void>;
  nextRound: () => Promise<void>;
  endGame: () => Promise<void>;
  playAgain: () => Promise<void>;
  exitGame: () => Promise<void>;
  leaveGame: () => Promise<void>;
  departedPlayerIDs: PlayerId[];
};

type SessionSnapshot = {
  session: Session;
  receivedAt: number;
};

export async function enterSession({
  session,
  playerID,
  join,
  startGame,
}: {
  session: Pick<Session, 'quickPlay'>;
  playerID: PlayerId;
  join: (playerID: PlayerId) => Promise<void>;
  startGame: () => Promise<void>;
}): Promise<void> {
  await join(playerID);
  if (session.quickPlay) await startGame();
}

export function useSessionController({
  sessionID,
  navigation,
}: SessionControllerOptions): SessionController {
  const { sessionApi }: DomainApis = useDomainApis();
  const { user }: CurrentUser = useCurrentUser();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const [snapshot, setSnapshot] = useState<SessionSnapshot>();
  const session: Session | undefined = snapshot?.session;
  const [isQuickPlayLaunchPending, setIsQuickPlayLaunchPending] =
    useState<boolean>(true);
  const departedPlayerIDs: PlayerId[] = usePlayerDepartures(session?.players);
  const [admission, setAdmission] = useState<SessionAdmission>({
    status: 'idle',
  });
  const automaticPlayerID: PlayerId | undefined = presetPlayerID({
    mode: session?.mode,
    username: user?.username,
  });
  const {
    localPlayerID,
    isAdmitting,
    error,
    returnToHome,
  }: SessionAdmissionDecision = createSessionAdmissionDecision({
    session,
    admission,
    automaticPlayerID,
  });
  const joinedPlayer: RefObject<JoinedSessionPlayer | null> =
    useRef<JoinedSessionPlayer | null>(null);
  const joinAttempted: RefObject<boolean> = useRef<boolean>(false);
  const joinInProgress: RefObject<boolean> = useRef<boolean>(false);
  const hasSnapshot: boolean = snapshot !== undefined;
  const {
    data: fetchedSession,
    error: fetchSessionError,
    isFetchedAfterMount,
  }: UseQueryResult<Session> = useQuery(
    sessionAdmissionQueryOptions({
      sessionApi,
      sessionID,
      hasSnapshot,
      admission,
      automaticPlayerID,
    }),
  );

  const restoreSession = useCallback(
    async (restoredChannel: SessionChannel) => {
      const player: JoinedSessionPlayer | null = joinedPlayer.current;
      if (!player) return;
      try {
        await restoredChannel.emit(sessionWsEvent.reconnect, {
          sessionID,
          playerID: player.playerID,
          reconnectToken: player.reconnectToken,
        });
      } catch (error: unknown) {
        if (!isSessionEntryRejected(error)) throw error;
        reportError(error);
        navigation.returnTo('/');
      }
    },
    [sessionID, reportError, navigation],
  );

  const {
    channel: sessionChannel,
    connectionStatus,
    retryConnection,
  }: WsChannelState<typeof sessionWsChannel> = useSessionChannel({
    restoreSession,
  });

  useEffect(() => {
    if (
      !isFetchedAfterMount ||
      joinInProgress.current ||
      joinedPlayer.current ||
      admission.status === 'pending' ||
      returnToHome
    ) {
      return;
    }
    if (
      fetchSessionError &&
      (!hasSnapshot || isSessionEntryRejected(fetchSessionError))
    ) {
      reportError(
        fetchSessionError,
        'Impossible de charger la partie. Vérifiez votre connexion et réessayez.',
      );
      navigation.returnTo('/');
      return;
    }
    if (fetchedSession) {
      const receivedAt: number = performance.now();
      setSnapshot((current) =>
        current?.session === fetchedSession
          ? current
          : { session: fetchedSession, receivedAt },
      );
    }
  }, [
    admission.status,
    fetchedSession,
    fetchSessionError,
    hasSnapshot,
    isFetchedAfterMount,
    navigation,
    reportError,
    returnToHome,
  ]);

  const gameStatus: GameStatus | undefined = session?.currentGame?.status;
  const userId: UserId | undefined = user?.id;

  useEffect(() => {
    if (gameStatus !== GameStatus.IN_RESULTS || !userId) return;
    invalidateGameRecords({ queryClient, userId });
  }, [gameStatus, userId, queryClient]);

  useEffect(
    () =>
      sessionChannel?.on(sessionWsServerEvent.update, (incoming: Session) => {
        setSnapshot({ session: incoming, receivedAt: performance.now() });
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
      if (joinInProgress.current || joinedPlayer.current) return;
      if (!session || !playerID)
        throw new Error(
          'Joining session failed: session or player not initialized',
        );
      joinAttempted.current = true;
      joinInProgress.current = true;
      setAdmission({ status: 'pending' });
      try {
        const admittedPlayer: JoinedSessionPlayer = await admitSessionPlayer({
          session,
          channel: { emit },
          playerID,
          userId: user?.id,
        });
        joinedPlayer.current = admittedPlayer;
        setAdmission({ status: 'admitted', playerID: admittedPlayer.playerID });
      } catch (error: unknown) {
        setAdmission({ status: 'rejected', error });
      } finally {
        joinInProgress.current = false;
      }
    },
    [session, emit, user?.id],
  );

  const startGame: SessionController['startGame'] = useCallback(async () => {
    await emit(sessionWsEvent.startGame);
  }, [emit]);

  useEffect(() => {
    if (
      connectionStatus !== 'connected' ||
      !session ||
      !automaticPlayerID ||
      joinAttempted.current
    )
      return;

    enterSession({
      session,
      playerID: automaticPlayerID,
      join,
      startGame: async () => {
        if (!joinedPlayer.current) return;
        await startGame();
      },
    })
      .catch((error: unknown) => {
        reportError(error);
        if (session.mode === SessionMode.SOLO) navigation.returnTo('/');
      })
      .finally(() => setIsQuickPlayLaunchPending(false));
  }, [
    connectionStatus,
    session,
    automaticPlayerID,
    join,
    startGame,
    reportError,
    navigation,
  ]);

  useEffect(() => {
    if (error === undefined) return;
    reportError(
      error,
      'Impossible de rejoindre la partie. Vérifiez votre connexion et réessayez.',
    );
    if (returnToHome) navigation.returnTo('/');
  }, [error, returnToHome, reportError, navigation]);

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

  const updateGameConfig = async (changes: GameConfigChanges) => {
    const current = requireSession('Updating game config');
    await emit(sessionWsEvent.updateGameConfig, {
      gameConfig: applyGameConfigChanges({
        gameConfig: current.gameConfig,
        changes,
      }),
    });
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
    setSnapshot(
      (previous) =>
        previous && {
          ...previous,
          session: withStatus(current, SessionStatus.IN_LOBBY),
        },
    );
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
    sessionReceivedAt: snapshot?.receivedAt,
    localPlayerID,
    isAdmitting,
    isHost: isHostOf(session, localPlayerID),
    isLaunchingQuickPlay:
      isQuickPlayLaunchPending && session?.quickPlay === true,
    connectionStatus,
    retryConnection,
    join,
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
    leaveGame: reportActionErrors({ action: leaveGame, reportError }),
    departedPlayerIDs,
  };
}
