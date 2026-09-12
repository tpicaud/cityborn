import {
  type ApiError,
  ApiResponseError,
  type GameConfig,
  type Guess,
  parseApiError,
} from '@cityborn/api';
import type { SocketConnection } from '../ports/socket';

export const SESSION_UPDATE_EVENT = 'session:update';

export interface SessionSocketPayloads {
  'session:join': { sessionID: string; playerID: string };
  'session:reconnect': { sessionID: string; playerID: string };
  'session:updateHost': { newHostID: string };
  'session:updateGameConfig': { gameConfig: GameConfig };
  'session:kickPlayer': { playerToKick: string };
  'session:guess': { guess: Guess };
  'session:startGame': undefined;
  'session:nextRound': undefined;
  'session:playAgain': undefined;
}

export type SessionSocketEvent = keyof SessionSocketPayloads;

export type SessionAck = { success: boolean; error?: unknown };

export function toSessionAckError(ack: SessionAck): ApiError {
  const statusCode =
    typeof ack.error === 'object' &&
    ack.error !== null &&
    'statusCode' in ack.error &&
    typeof ack.error.statusCode === 'number'
      ? ack.error.statusCode
      : 500;

  return parseApiError(statusCode, ack.error);
}

function isSessionAck(value: unknown): value is SessionAck {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof value.success === 'boolean'
  );
}

export function resolveSessionAck(ack: unknown): void {
  if (!isSessionAck(ack)) {
    throw new ApiResponseError(parseApiError(500, ack));
  }
  if (!ack.success) {
    throw new ApiResponseError(toSessionAckError(ack));
  }
}

export function emitSessionEvent<Event extends SessionSocketEvent>(
  connection: Pick<SocketConnection, 'emit'>,
  event: Event,
  ...[payload]: SessionSocketPayloads[Event] extends undefined
    ? []
    : [SessionSocketPayloads[Event]]
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const acknowledge = (ack: unknown) => {
      try {
        resolveSessionAck(ack);
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    if (payload === undefined) {
      connection.emit(event, acknowledge);
      return;
    }
    connection.emit(event, payload, acknowledge);
  });
}
