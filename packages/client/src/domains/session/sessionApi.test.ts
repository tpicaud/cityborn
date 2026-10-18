import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Session } from '@cityborn/api';
import type { SocketConnection } from '../../ws/socketConnection';
import { createSessionChannel, type SessionChannel } from './sessionApi';

type SubscriptionRecorder = {
  socket: SocketConnection;
  subscriptions: unknown[][];
  unsubscriptions: unknown[][];
};

function createSubscriptionRecorder(): SubscriptionRecorder {
  const subscriptions: unknown[][] = [];
  const unsubscriptions: unknown[][] = [];
  const socket: SocketConnection = {
    connected: true,
    active: true,
    connect: () => {},
    disconnect: () => {},
    emit: () => {},
    on: (event, listener) => {
      subscriptions.push([event, listener]);
    },
    off: (event, listener) => {
      unsubscriptions.push([event, listener]);
    },
    onReconnection: () => {},
    offReconnection: () => {},
  };
  return { socket, subscriptions, unsubscriptions };
}

describe('SessionChannel.onSessionUpdate', () => {
  it('detaches the session update listener it attached', () => {
    const { socket, subscriptions, unsubscriptions }: SubscriptionRecorder =
      createSubscriptionRecorder();
    const sessionChannel: SessionChannel = createSessionChannel(socket);
    const handleSessionUpdate: (session: Session) => void = () => {};
    const unsubscribe: () => void =
      sessionChannel.onSessionUpdate(handleSessionUpdate);

    unsubscribe();

    assert.deepEqual(subscriptions, [['session:update', handleSessionUpdate]]);
    assert.deepEqual(unsubscriptions, [
      ['session:update', handleSessionUpdate],
    ]);
  });
});
