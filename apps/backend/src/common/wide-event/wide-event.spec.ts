jest.mock('@cityborn/api', () => ({
  getApiVersionInfo: jest.fn(() => ({
    minSupportedVersion: 4,
    currentVersion: 7,
  })),
}));

import type { Request } from 'express';
import {
  createHttpWideEvent,
  createWsWideEvent,
  deriveWideEventLevel,
  deriveWideEventOutcome,
  emitWideEventLine,
  resolveHttpWideEventDomain,
  resolveWsWideEventDomain,
  type WideEvent,
} from './wide-event';

const buildRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    method: 'GET',
    originalUrl: '/fallback',
    headers: {},
    ...overrides,
  }) as Request;

describe('createHttpWideEvent', () => {
  it('generates a request id and captures the request basics', () => {
    const wideEvent = createHttpWideEvent(
      buildRequest({
        method: 'POST',
        ip: '1.2.3.4',
        route: { path: '/auth/sign-in' } as Request['route'],
        headers: {
          'user-agent': 'jest',
          'x-visitor-id': 'visitor-1',
          'x-client-name': 'web',
          'x-client-version': '1.2.3',
        },
      }),
    );

    expect(wideEvent).toMatchObject({
      transport: 'http',
      requestId: expect.any(String),
      method: 'POST',
      route: '/auth/sign-in',
      ip: '1.2.3.4',
      userAgent: 'jest',
      visitorId: 'visitor-1',
      client: 'web',
      clientVersion: '1.2.3',
      isAuthenticated: false,
    });
  });

  it('leaves the client fields undefined when the headers are absent', () => {
    const wideEvent = createHttpWideEvent(buildRequest());

    expect(wideEvent.client).toBeUndefined();
    expect(wideEvent.clientVersion).toBeUndefined();
  });

  it('reuses the pino request id', () => {
    expect(
      createHttpWideEvent(buildRequest({ id: 'pino-request-id' })).requestId,
    ).toBe('pino-request-id');
  });

  it('does not capture an unresolved URL', () => {
    expect(createHttpWideEvent(buildRequest()).route).toBe('<unresolved>');
  });

  it('uses the X-Api-Version header when it is an integer', () => {
    const wideEvent = createHttpWideEvent(
      buildRequest({ headers: { 'x-api-version': '5' } }),
    );

    expect(wideEvent.apiVersion).toBe(5);
  });

  it('falls back to the current api version when no header is provided', () => {
    expect(createHttpWideEvent(buildRequest()).apiVersion).toBe(7);
  });
});

describe('createWsWideEvent', () => {
  it('generates a request id and captures the socket message frame', () => {
    expect(
      createWsWideEvent({
        eventName: 'session:join',
        socketId: 'socket-1',
        ip: '1.2.3.4',
        userAgent: 'jest',
        visitorId: 'visitor-1',
        client: 'mobile',
        clientVersion: '0.1.4',
      }),
    ).toEqual({
      transport: 'ws',
      requestId: expect.any(String),
      eventName: 'session:join',
      socketId: 'socket-1',
      ip: '1.2.3.4',
      userAgent: 'jest',
      visitorId: 'visitor-1',
      client: 'mobile',
      clientVersion: '0.1.4',
      domain: 'session',
    });
  });
});

describe('deriveWideEventLevel', () => {
  it.each([
    ['success', 'info'],
    ['client_error', 'warn'],
    ['server_error', 'error'],
    ['aborted', 'warn'],
  ] as const)('maps outcome %s to %s', (outcome, level) => {
    expect(deriveWideEventLevel(outcome)).toBe(level);
  });
});

describe('deriveWideEventOutcome', () => {
  it.each([
    [200, 'success'],
    [302, 'success'],
    [400, 'client_error'],
    [404, 'client_error'],
    [500, 'server_error'],
    [503, 'server_error'],
  ] as const)('maps status %s to %s', (statusCode, outcome) => {
    expect(deriveWideEventOutcome(statusCode)).toBe(outcome);
  });
});

describe('wide event domain', () => {
  it.each([
    ['/auth/sign-in', 'auth'],
    ['/auth/future-action', 'auth'],
    ['/session/create-game', 'session'],
    ['/admin/guess-object/:id', 'guess_object'],
    ['/admin/world-location', 'world_location'],
  ] as const)('derives %s as the %s domain', (route, expected) => {
    expect(resolveHttpWideEventDomain(route)).toBe(expected);
  });

  it('falls back to system for an unknown route', () => {
    expect(resolveHttpWideEventDomain('<unmatched>')).toBe('system');
  });

  it('derives a websocket domain from the event prefix', () => {
    expect(resolveWsWideEventDomain('session:newMessage')).toBe('session');
    expect(resolveWsWideEventDomain('untrusted:value')).toBe('system');
  });
});

describe('emitWideEventLine', () => {
  const buildLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  });

  it('logs an http_request line at the level derived from the status code', () => {
    const logger = buildLogger();
    const wideEvent: WideEvent = {
      transport: 'http',
      requestId: 'r1',
      method: 'GET',
      route: '/x',
      domain: 'system',
      ip: undefined,
      userAgent: undefined,
      visitorId: undefined,
      client: undefined,
      clientVersion: undefined,
      apiVersion: 7,
      isAuthenticated: false,
      statusCode: 404,
      outcome: 'client_error',
    };

    emitWideEventLine(logger, wideEvent);

    expect(logger.warn).toHaveBeenCalledWith(
      { ...wideEvent, event: 'http_request' },
      'request',
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('logs a successful ws_message line at info', () => {
    const logger = buildLogger();
    const wideEvent: WideEvent = {
      transport: 'ws',
      requestId: 'r1',
      eventName: 'session:join',
      domain: 'session',
      socketId: 'socket-1',
      ip: undefined,
      userAgent: undefined,
      visitorId: undefined,
      client: undefined,
      clientVersion: undefined,
      outcome: 'success',
    };

    emitWideEventLine(logger, wideEvent);

    expect(logger.info).toHaveBeenCalledWith(
      { ...wideEvent, event: 'ws_message' },
      'message',
    );
  });

  it('logs a ws_message line at error for a 5xx status code', () => {
    const logger = buildLogger();
    const wideEvent: WideEvent = {
      transport: 'ws',
      requestId: 'r1',
      eventName: 'session:guess',
      domain: 'session',
      socketId: 'socket-1',
      ip: undefined,
      userAgent: undefined,
      visitorId: undefined,
      client: undefined,
      clientVersion: undefined,
      statusCode: 500,
      outcome: 'server_error',
    };

    emitWideEventLine(logger, wideEvent);

    expect(logger.error).toHaveBeenCalledWith(
      { ...wideEvent, event: 'ws_message' },
      'message',
    );
  });
});
