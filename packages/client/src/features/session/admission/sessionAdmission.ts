import {
  ApiResponseError,
  ErrorCode,
  isApiError,
  type PlayerId,
  type Session,
  type SessionJoinAck,
  type SessionPlayer,
  type SessionReconnectToken,
  sessionWsEvent,
  type UserId,
} from '@cityborn/api';
import type { SessionChannel } from '../../../domains/session/sessionApi';
import { hasSessionStarted } from '../sessionState';

export type JoinedSessionPlayer = {
  playerID: PlayerId;
  reconnectToken: SessionReconnectToken | undefined;
};

function returningSessionPlayer({
  session,
  userId,
}: {
  session: Session;
  userId: UserId | undefined;
}): SessionPlayer | undefined {
  return userId
    ? session.players.find((player) => !player.isGuest && player.id === userId)
    : undefined;
}

type AdmitSessionPlayerOptions = {
  session: Session;
  channel: Pick<SessionChannel, 'emit'>;
  playerID: PlayerId;
  userId: UserId | undefined;
};

export async function admitSessionPlayer({
  session,
  channel,
  playerID,
  userId,
}: AdmitSessionPlayerOptions): Promise<JoinedSessionPlayer> {
  const returningPlayer: SessionPlayer | undefined = returningSessionPlayer({
    session,
    userId,
  });
  if (returningPlayer) {
    await channel.emit(sessionWsEvent.reconnect, {
      sessionID: session.id,
      playerID: returningPlayer.username,
      reconnectToken: undefined,
    });
    return { playerID: returningPlayer.username, reconnectToken: undefined };
  }
  const { reconnectToken }: SessionJoinAck = await channel.emit(
    sessionWsEvent.join,
    {
      sessionID: session.id,
      playerID,
    },
  );
  return { playerID, reconnectToken };
}

export function isSessionEntryRejected(error: unknown): boolean {
  const code: ErrorCode | undefined =
    error instanceof ApiResponseError
      ? error.apiError.code
      : isApiError(error)
        ? error.code
        : undefined;
  return (
    code === ErrorCode.SESSION_NOT_FOUND ||
    code === ErrorCode.SESSION_ALREADY_IN_GAME
  );
}

export type SessionAdmission =
  | { status: 'idle' | 'pending' }
  | { status: 'rejected'; error: unknown }
  | { status: 'admitted'; playerID: PlayerId };

export type SessionAdmissionDecision = {
  localPlayerID: PlayerId | undefined;
  isAdmitting: boolean;
  error: unknown;
  returnToHome: boolean;
};

const sessionAlreadyStarted: ApiResponseError = new ApiResponseError({
  code: ErrorCode.SESSION_ALREADY_IN_GAME,
  statusCode: 403,
  message: 'Session already in game',
});

type SessionAdmissionDecisionOptions = {
  session: Session | undefined;
  admission: SessionAdmission;
  automaticPlayerID: PlayerId | undefined;
};

export function createSessionAdmissionDecision({
  session,
  admission,
  automaticPlayerID,
}: SessionAdmissionDecisionOptions): SessionAdmissionDecision {
  const hasStarted: boolean = hasSessionStarted(session);
  const rejectsVisitor: boolean =
    !automaticPlayerID &&
    hasStarted &&
    (admission.status === 'idle' || admission.status === 'rejected');
  const error: unknown =
    admission.status === 'rejected' &&
    (!rejectsVisitor || isSessionEntryRejected(admission.error))
      ? admission.error
      : rejectsVisitor
        ? sessionAlreadyStarted
        : undefined;

  return {
    localPlayerID:
      admission.status === 'admitted' ? admission.playerID : undefined,
    isAdmitting:
      admission.status !== 'admitted' &&
      (admission.status === 'pending' || !!automaticPlayerID || hasStarted),
    error,
    returnToHome:
      rejectsVisitor ||
      (admission.status === 'rejected' &&
        (!!automaticPlayerID || isSessionEntryRejected(admission.error))),
  };
}
