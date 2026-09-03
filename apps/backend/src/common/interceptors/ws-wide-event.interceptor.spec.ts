jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'rid') }));

import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { lastValueFrom, of, throwError } from 'rxjs';
import {
  type WideEventClsStore,
  WideEventService,
} from '../wide-event/wide-event.service';
import { WsWideEventInterceptor } from './ws-wide-event.interceptor';

const buildLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const buildClient = (overrides: Record<string, unknown> = {}) => ({
  id: 'socket-1',
  handshake: { headers: { 'user-agent': 'jest' }, address: '1.2.3.4' },
  data: {},
  ...overrides,
});

const buildWsContext = (
  client: unknown,
  pattern = 'session:join',
): ExecutionContext =>
  ({
    getType: () => 'ws',
    switchToWs: () => ({
      getClient: () => client,
      getData: () => ({}),
      getPattern: () => pattern,
    }),
  }) as unknown as ExecutionContext;

describe('WsWideEventInterceptor', () => {
  const build = () => {
    const logger = buildLogger();
    const cls = ClsServiceManager.getClsService<WideEventClsStore>();
    const wideEventService = new WideEventService(cls, logger);
    const interceptor = new WsWideEventInterceptor(wideEventService, cls);
    return { interceptor, logger, wideEventService };
  };

  it('opens a cls context and emits a single ws_message info line on success', async () => {
    const { interceptor, logger } = build();
    const handler: CallHandler = { handle: () => of({ success: true }) };

    const result = await lastValueFrom(
      interceptor.intercept(buildWsContext(buildClient()), handler),
    );

    expect(result).toEqual({ success: true });
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: 'ws',
        event: 'ws_message',
        eventName: 'session:join',
        socketId: 'socket-1',
        requestId: 'rid',
        ip: '1.2.3.4',
        userAgent: 'jest',
        isAuthenticated: false,
        durationMs: expect.any(Number),
      }),
      'message',
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('enriches userId when the socket carries an authenticated user', async () => {
    const { interceptor, logger } = build();
    const client = buildClient({ data: { user: { id: 'user-1' } } });

    await lastValueFrom(
      interceptor.intercept(buildWsContext(client), {
        handle: () => of({ success: true }),
      }),
    );

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', isAuthenticated: true }),
      'message',
    );
  });

  it('exposes the cls context to the handler so downstream enrichment lands on the same line', async () => {
    const { interceptor, wideEventService, logger } = build();
    const handler: CallHandler = {
      handle: () => {
        wideEventService.enrich({
          sessionId: 's1',
          playerId: 'p1',
          statusCode: 404,
        });
        return of({ success: false });
      },
    };

    await lastValueFrom(
      interceptor.intercept(buildWsContext(buildClient()), handler),
    );

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ws_message',
        sessionId: 's1',
        playerId: 'p1',
        statusCode: 404,
      }),
      'message',
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('still emits one line and propagates the error when the handler throws', async () => {
    const { interceptor, logger } = build();
    const failure = new Error('boom');
    const handler: CallHandler = { handle: () => throwError(() => failure) };

    await expect(
      lastValueFrom(
        interceptor.intercept(buildWsContext(buildClient()), handler),
      ),
    ).rejects.toBe(failure);

    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('passes through a non-ws context untouched', async () => {
    const { interceptor, logger } = build();
    const httpContext = {
      getType: () => 'http',
    } as unknown as ExecutionContext;

    const result = await lastValueFrom(
      interceptor.intercept(httpContext, { handle: () => of({ ok: true }) }),
    );

    expect(result).toEqual({ ok: true });
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
