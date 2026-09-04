import type { ClsService } from 'nestjs-cls';
import type { WideEventInit } from './wide-event';
import { type WideEventClsStore, WideEventService } from './wide-event.service';

const baseInit: WideEventInit = {
  transport: 'http',
  requestId: 'r1',
  domain: 'other',
  operation: 'GET /test',
  method: 'GET',
  route: '/x',
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
  return new WideEventService(cls);
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

    service.enrichAuth({ userId: 'u1', isAuthenticated: true });
    service.enrichBusinessContext({ sessionId: 's1' });

    expect(service.get()).toMatchObject({
      requestId: 'r1',
      userId: 'u1',
      isAuthenticated: true,
      sessionId: 's1',
    });
  });

  it('is a no-op when enrichment runs before any wide event is set', () => {
    const service = buildService();

    service.enrichBusinessContext({ sessionId: 's1' });

    expect(service.get()).toBeUndefined();
  });

  it('returns a finalized event only after outcome fields are supplied', () => {
    const service = buildService();
    service.set(baseInit);

    const finalized = service.finalize({
      statusCode: 200,
      outcome: 'success',
      durationMs: 12,
    });

    expect(finalized).toMatchObject({
      requestId: 'r1',
      statusCode: 200,
      outcome: 'success',
      durationMs: 12,
    });
  });
});
