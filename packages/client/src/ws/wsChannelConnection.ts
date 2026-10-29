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
  ): () => void;
}

export function toWsChannelConnection<Definition extends WsChannel>(
  socket: SocketConnection,
): WsChannelConnection<Definition> {
  return {
    emit: createWsEmit({ connection: socket }),
    on: (event, listener) => {
      socket.on(event, listener);
      return () => socket.off(event, listener);
    },
  };
}
