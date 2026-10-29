'use client';

import type {
  GameConfigChanges,
  Guess,
  PlayerId,
  Session,
  SessionId,
  UserId,
} from '@cityborn/api';
import {
  ApiResponseError,
  applyGameConfigChanges,
  ErrorCode,
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
import {
  admitSessionPlayer,
  isSessionEntryRejected,
  type JoinedSessionPlayer,
} from './admission/sessionAdmission';
import { requireOpenedSessionChannel } from './openedSessionChannel';
import { reportActionErrors } from './reportedAction';
import { presetPlayerID } from './sessionPlayers';
import { isHostOf, mergeSessionUpdate, withStatus } from './sessionState';

type SessionAdmission =
  | { status: 'idle' | 'pending' | 'rejected' }
  | { status: 'admitted'; playerID: PlayerId };

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
  guess: (guess: Guess) => Promise<void>;
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
  const localPlayerID: PlayerId | undefined =
    admission.status === 'admitted' ? admission.playerID : undefined;
  const automaticPlayerID: PlayerId | undefined = presetPlayerID({
    mode: session?.mode,
    username: user?.username,
  });
  const joinedPlayer: RefObject<JoinedSessionPlayer | null> =
    useRef<JoinedSessionPlayer | null>(null);
  const joinAttempted: RefObject<boolean> = useRef<boolean>(false);

  const restoreSession = useCallback(
    async (restoredChannel: SessionChannel) => {
      const player: JoinedSessionPlayer | null = joinedPlayer.current;
      if (!player) return;
      try {
        await restoredChannel.reconnect({
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
  }: WsChannelState<SessionChannel> = useSessionChannel({ restoreSession });

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
      setAdmission({ status: 'pending' });
      try {
        const admittedPlayer: JoinedSessionPlayer = await admitSessionPlayer({
          session,
          channel: openedChannel,
          playerID,
          userId: user?.id,
        });
        joinedPlayer.current = admittedPlayer;
        setAdmission({ status: 'admitted', playerID: admittedPlayer.playerID });
      } catch (error: unknown) {
        setAdmission({ status: 'rejected' });
        throw error;
      }
    },
    [session, sessionChannel, user?.id],
  );

  useEffect(() => {
    if (
      connectionStatus !== 'connected' ||
      !session ||
      !automaticPlayerID ||
      joinAttempted.current
    )
      return;

    join(automaticPlayerID).catch((error: unknown) => {
      reportError(
        error,
        'Impossible de rejoindre la partie. Vérifiez votre connexion et réessayez.',
      );
      navigation.returnTo('/');
    });
  }, [
    connectionStatus,
    session,
    automaticPlayerID,
    join,
    reportError,
    navigation,
  ]);

  useEffect(() => {
    if (
      !session ||
      admission.status !== 'idle' ||
      automaticPlayerID ||
      session.status !== SessionStatus.IN_GAME
    )
      return;
    reportError(
      new ApiResponseError({
        code: ErrorCode.SESSION_ALREADY_IN_GAME,
        statusCode: 403,
        message: 'Session already in game',
      }),
    );
    navigation.returnTo('/');
  }, [session, admission.status, automaticPlayerID, reportError, navigation]);

  const joinFromPlayerName = async (playerID: PlayerId): Promise<void> => {
    try {
      await join(playerID);
    } catch (error: unknown) {
      reportError(
        error,
        'Impossible de rejoindre la partie. Vérifiez votre connexion et réessayez.',
      );
      if (isSessionEntryRejected(error)) navigation.returnTo('/');
    }
  };

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
    isAdmitting:
      !localPlayerID &&
      (admission.status === 'pending' ||
        !!automaticPlayerID ||
        session?.status === SessionStatus.IN_GAME ||
        !!session?.currentGame),
    isHost: isHostOf(session, localPlayerID),
    connectionStatus,
    retryConnection,
    join: joinFromPlayerName,
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
