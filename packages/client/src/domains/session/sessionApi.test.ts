import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Session, sessionWsChannel } from '@cityborn/api';
import type { WsChannelConnection } from '../../ws/wsChannelConnection';
import { createSessionChannel, type SessionChannel } from './sessionApi';

type ConnectionRecorder = {
  connection: WsChannelConnection<typeof sessionWsChannel>;
  emissions: unknown[][];
  subscriptions: unknown[][];
  unsubscriptions: unknown[][];
};

function createConnectionRecorder(): ConnectionRecorder {
  const emissions: unknown[][] = [];
  const subscriptions: unknown[][] = [];
  const unsubscriptions: unknown[][] = [];
  const connection: WsChannelConnection<typeof sessionWsChannel> = {
    emit: (event, ...payload) => {
      emissions.push([event, ...payload]);
      return new Promise(() => {});
    },
    on: (event, listener) => {
      subscriptions.push([event, listener]);
    },
    off: (event, listener) => {
      unsubscriptions.push([event, listener]);
    },
  };
  return { connection, emissions, subscriptions, unsubscriptions };
}

describe('SessionChannel.submitGuess', () => {
  it('emits the guess submission on the submitGuess event', () => {
    const { connection, emissions }: ConnectionRecorder =
      createConnectionRecorder();
    const sessionChannel: SessionChannel = createSessionChannel(connection);

    void sessionChannel.submitGuess({ coordinates: { lat: 48.85, lng: 2.35 } });

    assert.deepEqual(emissions, [
      [
        'session:submitGuess',
        { guess: { coordinates: { lat: 48.85, lng: 2.35 } } },
      ],
    ]);
  });
});

describe('SessionChannel.onSessionUpdate', () => {
  it('detaches the session update listener it attached', () => {
    const { connection, subscriptions, unsubscriptions }: ConnectionRecorder =
      createConnectionRecorder();
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
