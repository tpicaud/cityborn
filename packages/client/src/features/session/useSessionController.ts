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
  SessionStatus,
  type sessionWsChannel,
  sessionWsEvent,
  sessionWsServerEvent,
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
import {
  admitSessionPlayer,
  createSessionAdmissionDecision,
  isSessionEntryRejected,
  type JoinedSessionPlayer,
  type SessionAdmission,
  type SessionAdmissionDecision,
} from './admission/sessionAdmission';
import { createGuessSubmission } from './guessSubmission';
import { requireOpenedSessionChannel } from './openedSessionChannel';
import { reportActionErrors } from './reportedAction';
import { presetPlayerID } from './sessionPlayers';
import { isHostOf, withStatus } from './sessionState';

export type SessionControllerOptions = {
  sessionID: SessionId;
  navigation: Navigation;
};

export type SessionController = {
  session: Session | undefined;
  localPlayerID: PlayerId | undefined;
  isAdmitting: boolean;
  isHost: boolean;
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
    const loadSession = async (): Promise<void> => {
      try {
        setSession(await sessionApi.fetchSession(sessionID));
      } catch (error: unknown) {
        reportError(
          error,
          'Impossible de charger la partie. Vérifiez votre connexion et réessayez.',
        );
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
      }
    },
    [session, emit, user?.id],
  );

  useEffect(() => {
    if (
      connectionStatus !== 'connected' ||
      !session ||
      !automaticPlayerID ||
      joinAttempted.current
    )
      return;

    join(automaticPlayerID);
  }, [connectionStatus, session, automaticPlayerID, join]);

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

  const startGame = async () => {
    await emit(sessionWsEvent.startGame);
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

  return {
    session,
    localPlayerID,
    isAdmitting,
    isHost: isHostOf(session, localPlayerID),
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
  };
}
