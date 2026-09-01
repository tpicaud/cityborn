jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'generated-request-id') }));
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
  emitWideEventLine,
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
        },
      }),
    );

    expect(wideEvent).toMatchObject({
      transport: 'http',
      requestId: 'generated-request-id',
      method: 'POST',
      route: '/auth/sign-in',
      ip: '1.2.3.4',
      userAgent: 'jest',
      visitorId: 'visitor-1',
    });
  });

  it('falls back to the original url when the route is not resolved', () => {
    expect(createHttpWideEvent(buildRequest()).route).toBe('/fallback');
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
      }),
    ).toEqual({
      transport: 'ws',
      requestId: 'generated-request-id',
      eventName: 'session:join',
      socketId: 'socket-1',
      ip: '1.2.3.4',
      userAgent: 'jest',
      visitorId: 'visitor-1',
    });
  });
});

describe('deriveWideEventLevel', () => {
  it.each([
    [undefined, 'info'],
    [200, 'info'],
    [302, 'info'],
    [400, 'warn'],
    [404, 'warn'],
    [500, 'error'],
    [503, 'error'],
  ])('maps status %s to %s', (statusCode, level) => {
    expect(deriveWideEventLevel(statusCode)).toBe(level);
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
      ip: undefined,
      userAgent: undefined,
      visitorId: undefined,
      apiVersion: 7,
      statusCode: 404,
    };

    emitWideEventLine(logger, wideEvent);

    expect(logger.warn).toHaveBeenCalledWith(
      { ...wideEvent, event: 'http_request' },
      'request',
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('logs a ws_message line at info when no status code is set', () => {
    const logger = buildLogger();
    const wideEvent: WideEvent = {
      transport: 'ws',
      requestId: 'r1',
      eventName: 'session:join',
      socketId: 'socket-1',
      ip: undefined,
      userAgent: undefined,
      visitorId: undefined,
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
      socketId: 'socket-1',
      ip: undefined,
      userAgent: undefined,
      visitorId: undefined,
      statusCode: 500,
    };

    emitWideEventLine(logger, wideEvent);

    expect(logger.error).toHaveBeenCalledWith(
      { ...wideEvent, event: 'ws_message' },
      'message',
    );
  });
});
