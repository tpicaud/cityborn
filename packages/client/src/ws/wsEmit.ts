import type {
  ApiError,
  WsAckCallback,
  WsClientEvent,
  WsClientEventName,
  WsPayloadArgs,
} from '@cityborn/api';
import {
  ErrorCode,
  emptyWsAckDataSchema,
  parseApiError,
  wsAckSchema,
  wsClientEventDefinitions,
  wsEmitArgs,
} from '@cityborn/api';
import type { SocketConnection } from '../platform/socket';

export const WS_ACK_TIMEOUT_MS = 10_000;

const WS_TRANSPORT_STATUS = 503;
const WS_TIMEOUT_STATUS = 504;
const WS_UNEXPECTED_ACK_STATUS = 500;

/** Émet un event du contrat et résout sur l'accusé de réception du serveur. */
export type WsEmit = <Name extends WsClientEventName>(
  event: Name,
  ...payload: WsPayloadArgs<Name>
) => Promise<void>;

function transportError(
  code: ErrorCode,
  statusCode: number,
  message: string,
): ApiError {
  return { code, statusCode, message };
}

function invalidPayloadError(event: string, reason: string): ApiError {
  return {
    code: ErrorCode.BAD_REQUEST,
    statusCode: 400,
    message: `${event}: ${reason}`,
  };
}

/**
 * Construit l'émetteur WS d'une connexion : le corps sortant et l'enveloppe
 * d'ack sont validés par le contrat, et une absence de réponse est rejetée
 * plutôt que laissée en suspens.
 */
export function createWsEmit(
  connection: SocketConnection | null,
  ackTimeoutMs: number = WS_ACK_TIMEOUT_MS,
): WsEmit {
  return <Name extends WsClientEventName>(
    event: Name,
    ...payload: WsPayloadArgs<Name>
  ): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      if (!connection)
        return reject(
          transportError(
            ErrorCode.WS_NOT_CONNECTED,
            WS_TRANSPORT_STATUS,
            `${event}: socket unavailable`,
          ),
        );

      const definition: WsClientEvent | undefined =
        wsClientEventDefinitions[event];

      if (definition?.payload) {
        const outgoing = definition.payload.safeParse(payload[0]);
        if (!outgoing.success)
          return reject(
            invalidPayloadError(event, outgoing.error.issues[0].message),
          );
      }

      const ackSchema = wsAckSchema(definition?.ack ?? emptyWsAckDataSchema);
      let settled = false;

      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(
          transportError(
            ErrorCode.WS_ACK_TIMEOUT,
            WS_TIMEOUT_STATUS,
            `${event}: no acknowledgement received`,
          ),
        );
      }, ackTimeoutMs);

      const handleAck: WsAckCallback<Name> = (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);

        const ack = ackSchema.safeParse(response);
        if (!ack.success)
          return reject(parseApiError(WS_UNEXPECTED_ACK_STATUS, response));
        if (ack.data.success) return resolve();
        reject(parseApiError(WS_UNEXPECTED_ACK_STATUS, ack.data.error));
      };

      connection.emit(event, ...wsEmitArgs<Name>(payload, handleAck));
    });
}
