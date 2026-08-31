jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'generated-request-id') }));
jest.mock('@cityborn/api', () => ({
  getApiVersionInfo: jest.fn(() => ({
    minSupportedVersion: 4,
    currentVersion: 7,
  })),
}));

import type { Request } from 'express';
import { createWideEvent, deriveWideEventLevel } from './wide-event';

const buildRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    method: 'GET',
    originalUrl: '/fallback',
    headers: {},
    ...overrides,
  }) as Request;

describe('createWideEvent', () => {
  it('generates a request id and captures the request basics', () => {
    const wideEvent = createWideEvent(
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
      requestId: 'generated-request-id',
      method: 'POST',
      route: '/auth/sign-in',
      ip: '1.2.3.4',
      userAgent: 'jest',
      visitorId: 'visitor-1',
    });
  });

  it('falls back to the original url when the route is not resolved', () => {
    expect(createWideEvent(buildRequest()).route).toBe('/fallback');
  });

  it('uses the X-Api-Version header when it is an integer', () => {
    const wideEvent = createWideEvent(
      buildRequest({ headers: { 'x-api-version': '5' } }),
    );

    expect(wideEvent.apiVersion).toBe(5);
  });

  it('falls back to the current api version when no header is provided', () => {
    expect(createWideEvent(buildRequest()).apiVersion).toBe(7);
  });
});

describe('deriveWideEventLevel', () => {
  it.each([
    [200, 'info'],
    [302, 'info'],
    [400, 'warn'],
    [404, 'warn'],
    [500, 'error'],
    [503, 'error'],
  ])('maps status %i to %s', (statusCode, level) => {
    expect(deriveWideEventLevel(statusCode)).toBe(level);
  });
});
