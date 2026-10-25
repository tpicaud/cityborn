import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSession,
  contract,
  PlayerIdSchema,
  type Session,
  SessionIdSchema,
  SessionMode,
  type sessionWsChannel,
  UserFacingError,
} from '@cityborn/api';
import { initClient } from '@ts-rest/core';
import type { WsChannelConnection } from '../../ws/wsChannelConnection';
import {
  createSessionApi,
  createSessionChannel,
  type SessionApi,
  type SessionChannel,
} from './sessionApi';

type SubscriptionRecorder = {
  connection: WsChannelConnection<typeof sessionWsChannel>;
  subscriptions: unknown[][];
  emissions: unknown[][];
  unsubscriptions: unknown[][];
};

function createSubscriptionRecorder(): SubscriptionRecorder {
  const subscriptions: unknown[][] = [];
  const emissions: unknown[][] = [];
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
  return { connection, subscriptions, unsubscriptions, emissions };
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

describe('SessionChannel scoring protocol', () => {
  it('announces server scoring on join and reconnection and submits only the modern event', () => {
    const { connection, emissions }: SubscriptionRecorder =
      createSubscriptionRecorder();
    const channel: SessionChannel = createSessionChannel(connection);
    const sessionID: Session['id'] = SessionIdSchema.parse('session-1');
    const playerID: Session['hostID'] = PlayerIdSchema.parse('guest');

    void channel.join({ sessionID, playerID });
    void channel.reconnect({ sessionID, playerID, reconnectToken: undefined });
    void channel.guess({ coordinates: { lat: 48, lng: 2 } });

    assert.deepEqual(emissions, [
      [
        'session:join',
        {
          sessionID: 'session-1',
          playerID: 'guest',
          scoringProtocol: 'server-scoring',
        },
      ],
      [
        'session:reconnect',
        {
          sessionID: 'session-1',
          playerID: 'guest',
          reconnectToken: undefined,
          scoringProtocol: 'server-scoring',
        },
      ],
      ['session:submitGuess', { guess: { coordinates: { lat: 48, lng: 2 } } }],
    ]);
  });
});

describe('SessionApi.createSession', () => {
  it('creates server-scored sessions by default', async () => {
    const requests: unknown[] = [];
    const session: Session = buildSession({
      scoringProtocol: 'server-scoring',
    });
    const api: SessionApi = createSessionApi(
      initClient(contract, {
        baseUrl: 'https://cityborn.test',
        baseHeaders: {},
        api: async ({ body }) => {
          requests.push(body);
          return { status: 201, body: session, headers: new Headers() };
        },
      }),
    );

    await api.createSession({ mode: SessionMode.SOLO });

    assert.deepEqual(requests, [
      JSON.stringify({
        mode: SessionMode.SOLO,
        scoringProtocol: 'server-scoring',
      }),
    ]);
  });
});

describe('SessionApi.fetchSession', () => {
  it('rejects a legacy session with an actionable message', async () => {
    const session: Session = buildSession();
    const api: SessionApi = createSessionApi(
      initClient(contract, {
        baseUrl: 'https://cityborn.test',
        baseHeaders: {},
        api: async () => ({
          status: 200,
          body: session,
          headers: new Headers(),
        }),
      }),
    );

    await assert.rejects(
      api.fetchSession(session.id),
      (error: unknown) =>
        error instanceof UserFacingError &&
        error.message.includes('Créez une nouvelle session'),
    );
  });

  it('loads a server-scored session', async () => {
    const session: Session = buildSession({
      scoringProtocol: 'server-scoring',
    });
    const api: SessionApi = createSessionApi(
      initClient(contract, {
        baseUrl: 'https://cityborn.test',
        baseHeaders: {},
        api: async () => ({
          status: 200,
          body: session,
          headers: new Headers(),
        }),
      }),
    );

    assert.deepEqual(await api.fetchSession(session.id), session);
  });
});
