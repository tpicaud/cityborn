import {
  ApiResponseError,
  ErrorCode,
  isApiError,
  type PlayerId,
  type Session,
  type SessionJoinAck,
  type SessionPlayer,
  type SessionReconnectToken,
  SessionStatus,
  type UserId,
} from '@cityborn/api';
import type { SessionChannel } from '../../../domains/session/sessionApi';

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
  channel: Pick<SessionChannel, 'join' | 'reconnect'>;
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
    await channel.reconnect({
      sessionID: session.id,
      playerID: returningPlayer.username,
      reconnectToken: undefined,
    });
    return { playerID: returningPlayer.username, reconnectToken: undefined };
  }
  if (session.status === SessionStatus.IN_GAME || session.currentGame) {
    throw new ApiResponseError({
      code: ErrorCode.SESSION_ALREADY_IN_GAME,
      statusCode: 403,
      message: 'Session already in game',
    });
  }
  const { reconnectToken }: SessionJoinAck = await channel.join({
    sessionID: session.id,
    playerID,
  });
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
