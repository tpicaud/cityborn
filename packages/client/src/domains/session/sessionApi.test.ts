import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Session, sessionWsChannel } from '@cityborn/api';
import type { WsChannelConnection } from '../../ws/wsChannelConnection';
import { createSessionChannel, type SessionChannel } from './sessionApi';

type SubscriptionRecorder = {
  connection: WsChannelConnection<typeof sessionWsChannel>;
  subscriptions: unknown[][];
  unsubscriptions: unknown[][];
};

function createSubscriptionRecorder(): SubscriptionRecorder {
  const subscriptions: unknown[][] = [];
  const unsubscriptions: unknown[][] = [];
  const connection: WsChannelConnection<typeof sessionWsChannel> = {
    emit: () => new Promise(() => {}),
    on: (event, listener) => {
      subscriptions.push([event, listener]);
    },
    off: (event, listener) => {
      unsubscriptions.push([event, listener]);
    },
  };
  return { connection, subscriptions, unsubscriptions };
}

describe('SessionChannel.onSessionUpdate', () => {
  it('detaches the session update listener it attached', () => {
    const { connection, subscriptions, unsubscriptions }: SubscriptionRecorder =
      createSubscriptionRecorder();
    const sessionChannel: SessionChannel = createSessionChannel(connection);
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
