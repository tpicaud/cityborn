import type { ClsService } from 'nestjs-cls';
import type { WideEventInit } from './wide-event';
import { type WideEventClsStore, WideEventService } from './wide-event.service';

const baseInit: WideEventInit = {
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
};

const buildService = () => {
  const store = new Map<string, unknown>();
  const cls = {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => store.set(key, value),
  } as unknown as ClsService<WideEventClsStore>;
  return new WideEventService(cls, {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  });
};

describe('WideEventService', () => {
  it('stores the initial wide event', () => {
    const service = buildService();

    service.set(baseInit);

    expect(service.get()).toMatchObject({ requestId: 'r1', method: 'GET' });
  });

  it('merges enrichment fields without dropping existing ones', () => {
    const service = buildService();
    service.set(baseInit);

    service.enrich({ userId: 'u1', isAuthenticated: true });
    service.enrich({ statusCode: 200, durationMs: 12 });

    expect(service.get()).toMatchObject({
      requestId: 'r1',
      userId: 'u1',
      isAuthenticated: true,
      statusCode: 200,
      durationMs: 12,
    });
  });

  it('is a no-op when enrich runs before any wide event is set', () => {
    const service = buildService();

    service.enrich({ statusCode: 200 });

    expect(service.get()).toBeUndefined();
  });

  it('completes an event exactly once', () => {
    const service = buildService();
    service.set(baseInit);

    const completed = service.complete({ outcome: 'success', statusCode: 200 });
    const duplicate = service.complete({
      outcome: 'server_error',
      statusCode: 500,
    });

    expect(completed).toMatchObject({
      outcome: 'success',
      statusCode: 200,
      durationMs: expect.any(Number),
    });
    expect(duplicate).toBeUndefined();
    expect(service.get()).toMatchObject({
      outcome: 'success',
      statusCode: 200,
    });
  });
});
