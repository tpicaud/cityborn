import {
  contract,
  sessionWsChannel,
  sessionWsEvent,
  wsLifecycleEventName,
} from '@cityborn/api';
import type { AppRoute, AppRouter } from '@ts-rest/core';
import { isAppRoute } from '@ts-rest/core';
import type { WideEventDomain, WsWideEventInit } from './wide-event';
import {
  createWsWideEvent,
  deriveHttpDomain,
  WS_CONNECT_EVENT_NAME,
} from './wide-event';

function collectContractPaths(router: AppRouter): string[] {
  return Object.values(router).flatMap((entry: AppRoute | AppRouter) =>
    isAppRoute(entry) ? [entry.path] : collectContractPaths(entry),
  );
}

describe('deriveHttpDomain', () => {
  it('maps every contract route to a domain of the API vocabulary', () => {
    const contractPaths: string[] = collectContractPaths(contract);

    const unclassifiedPaths: string[] = contractPaths.filter(
      (path: string) => deriveHttpDomain(path) === 'other',
    );

    expect(contractPaths.length).toBeGreaterThan(0);
    expect(unclassifiedPaths).toEqual([]);
  });

  it('falls back to other for a route outside the contract', () => {
    const domain: WideEventDomain = deriveHttpDomain('/v1/sessions/:id');

    expect(domain).toBe('other');
  });
});

describe('createWsWideEvent', () => {
  it('uses the contract action for a message and a channel lifecycle event', () => {
    const message = createWsWideEvent({
      kind: 'message',
      eventName: sessionWsEvent.guess,
      socketId: 'socket-1',
      ip: undefined,
      userAgent: undefined,
      visitorId: undefined,
      client: undefined,
      clientVersion: undefined,
    });
    const connection = createWsWideEvent({
      kind: 'connection',
      eventName: wsLifecycleEventName(sessionWsChannel, 'connect'),
      socketId: 'socket-1',
      ip: undefined,
      userAgent: undefined,
      visitorId: undefined,
      client: undefined,
      clientVersion: undefined,
    });

    expect(message.action).toBe('session.guess');
    expect(connection.action).toBe('session.connect');
  });

  it('classifies the transport connection outside any channel', () => {
    const connection: WsWideEventInit = createWsWideEvent({
      kind: 'connection',
      eventName: WS_CONNECT_EVENT_NAME,
      socketId: 'socket-1',
      ip: undefined,
      userAgent: undefined,
      visitorId: undefined,
      client: undefined,
      clientVersion: undefined,
    });

    expect(connection).toMatchObject({
      domain: 'infrastructure',
      operation: 'connect',
      eventName: 'connect',
    });
    expect(connection.action).toBeUndefined();
  });

  it('rejects a message that is missing from the channel registry', () => {
    expect(() =>
      createWsWideEvent({
        kind: 'message',
        eventName: 'session:unknown',
        socketId: 'socket-1',
        ip: undefined,
        userAgent: undefined,
        visitorId: undefined,
        client: undefined,
        clientVersion: undefined,
      }),
    ).toThrow('Unregistered WebSocket event: session:unknown');
  });
});
