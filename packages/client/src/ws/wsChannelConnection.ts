import type {
  WsAckSuccessOf,
  WsChannel,
  WsChannelClientEventName,
  WsChannelServerEventName,
  WsPayloadArgs,
  WsServerToClientEvents,
} from '@cityborn/api';
import type { SocketConnection } from './socketConnection';
import { createWsEmit } from './wsEmit';

export interface WsChannelConnection<Definition extends WsChannel> {
  emit<Name extends WsChannelClientEventName<Definition>>(
    event: Name,
    ...payload: WsPayloadArgs<Name>
  ): Promise<WsAckSuccessOf<Name>>;
  on<Name extends WsChannelServerEventName<Definition>>(
    event: Name,
    listener: WsServerToClientEvents[Name],
  ): void;
  off<Name extends WsChannelServerEventName<Definition>>(
    event: Name,
    listener: WsServerToClientEvents[Name],
  ): void;
}

export function toWsChannelConnection(
  socket: SocketConnection,
): WsChannelConnection<WsChannel> {
  return {
    emit: createWsEmit({ connection: socket }),
    on: (event, listener) => {
      socket.on(event, listener);
    },
    off: (event, listener) => {
      socket.off(event, listener);
    },
  };
}
