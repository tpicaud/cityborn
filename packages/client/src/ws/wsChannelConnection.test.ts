import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  type PlayerId,
  PlayerIdSchema,
  type Session,
  sessionWsEvent,
  sessionWsServerEvent,
  type WsChannel,
} from '@cityborn/api';
import type { SocketConnection } from './socketConnection';
import {
  toWsChannelConnection,
  type WsChannelConnection,
} from './wsChannelConnection';

type RecordedSocket = {
  socket: SocketConnection;
  emissions: unknown[][];
  subscriptions: unknown[][];
  unsubscriptions: unknown[][];
};

const newHostID: PlayerId = PlayerIdSchema.parse('p2');

function isAckCallback(value: unknown): value is (ack: unknown) => void {
  return typeof value === 'function';
}

function createRecordedSocket(): RecordedSocket {
  const emissions: unknown[][] = [];
  const subscriptions: unknown[][] = [];
  const unsubscriptions: unknown[][] = [];

  const socket: SocketConnection = {
    connected: true,
    active: true,
    connect: () => {},
    disconnect: () => {},
    emit: (event, ...args) => {
      const emission: unknown[] = [event, ...args];
      emissions.push(emission);

      const respond: unknown = emission[emission.length - 1];
      if (isAckCallback(respond)) respond({ success: true });
    },
    on: (event, listener) => {
      subscriptions.push([event, listener]);
    },
    off: (event, listener) => {
      unsubscriptions.push([event, listener]);
    },
    onReconnection: () => {},
    offReconnection: () => {},
  };

  return { socket, emissions, subscriptions, unsubscriptions };
}

describe('toWsChannelConnection', () => {
  it('attaches and detaches the same listener on the socket', () => {
    const { socket, subscriptions, unsubscriptions }: RecordedSocket =
      createRecordedSocket();
    const connection: WsChannelConnection<WsChannel> =
      toWsChannelConnection(socket);
    const handleSessionUpdate: (session: Session) => void = () => {};

    connection.on(sessionWsServerEvent.update, handleSessionUpdate);
    connection.off(sessionWsServerEvent.update, handleSessionUpdate);

    assert.deepEqual(subscriptions, [['session:update', handleSessionUpdate]]);
    assert.deepEqual(unsubscriptions, [
      ['session:update', handleSessionUpdate],
    ]);
  });

  it('emits the event and its payload on the socket', async () => {
    const { socket, emissions }: RecordedSocket = createRecordedSocket();
    const connection: WsChannelConnection<WsChannel> =
      toWsChannelConnection(socket);

    await connection.emit(sessionWsEvent.updateHost, { newHostID });

    const [event, payload, respond]: unknown[] = emissions[0];
    assert.equal(event, 'session:updateHost');
    assert.deepEqual(payload, { newHostID: 'p2' });
    assert.equal(typeof respond, 'function');
  });
});
