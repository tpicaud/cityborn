jest.mock('nanoid', () => {
  let sequence = 0;
  return { nanoid: jest.fn(() => `ws-request-${++sequence}`) };
});

import { EventEmitter } from 'node:events';
import { setTimeout } from 'node:timers/promises';
import { ErrorCode } from '@cityborn/api';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { delay, isObservable, lastValueFrom, of } from 'rxjs';
import type { SessionSocket } from '../types/session-socket';
import type { WideEventLogger } from './wide-event';
import { type WideEventClsStore, WideEventService } from './wide-event.service';
import { WsWideEventLifecycle } from './ws-wide-event.lifecycle';

const buildClient = (id: string): SessionSocket => {
  const client = new EventEmitter();
  return Object.assign(client, {
    id,
    data: {},
    handshake: {
      address: '1.2.3.4',
      headers: { 'user-agent': 'jest' },
    },
  }) as unknown as SessionSocket;
};

const buildLifecycle = () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const cls = ClsServiceManager.getClsService<WideEventClsStore>();
  const wideEventService = new WideEventService(cls);
  const lifecycle = new WsWideEventLifecycle(
    wideEventService,
    cls,
    logger as unknown as WideEventLogger,
  );
  return { lifecycle, logger, wideEventService };
};

describe('WsWideEventLifecycle', () => {
  it('emits one complete event when a message succeeds', async () => {
    const { lifecycle, logger } = buildLifecycle();

    await expect(
      lifecycle.run(buildClient('socket-1'), 'session:join', async () => ({
        success: true,
      })),
    ).resolves.toEqual({ success: true });

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ws_message',
        domain: 'session',
        operation: 'session:join',
        outcome: 'success',
        statusCode: 200,
      }),
      'message',
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('emits one enriched client_error event for a WS 429 before normal handling', async () => {
    const { lifecycle, logger, wideEventService } = buildLifecycle();
    const failure = new HttpException(
      {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );

    await expect(
      lifecycle.run(buildClient('socket-1'), 'session:guess', async () => {
        wideEventService.enrichRateLimit({
          rateLimitBucket: 'rl:ws:msg',
          rateLimitRemaining: 0,
          rateLimitStatus: 'rejected',
        });
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ws_message',
        domain: 'session',
        outcome: 'client_error',
        statusCode: 429,
        errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
        rateLimitBucket: 'rl:ws:msg',
        rateLimitRemaining: 0,
        rateLimitStatus: 'rejected',
      }),
      'message',
    );
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('marks a message aborted when its socket disconnects during processing', async () => {
    const { lifecycle, logger } = buildLifecycle();
    const client = buildClient('socket-1');

    await lifecycle.run(client, 'session:guess', async () => {
      client.emit('disconnect');
      await setTimeout(1);
    });

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ws_message',
        outcome: 'aborted',
      }),
      'message',
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('waits for an Observable handler to complete before emitting', async () => {
    const { lifecycle, logger } = buildLifecycle();
    const result = await lifecycle.run(
      buildClient('socket-1'),
      'session:guess',
      async () => of({ success: true }).pipe(delay(1)),
    );

    expect(logger.info).not.toHaveBeenCalled();
    if (!isObservable(result)) {
      throw new Error('Expected an Observable result');
    }
    await lastValueFrom(result);

    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('isolates concurrent message enrichments in CLS', async () => {
    const { lifecycle, logger, wideEventService } = buildLifecycle();

    await Promise.all([
      lifecycle.run(buildClient('socket-slow'), 'session:guess', async () => {
        wideEventService.enrichBusinessContext({ sessionId: 'slow' });
        await setTimeout(20);
      }),
      lifecycle.run(buildClient('socket-fast'), 'session:guess', async () => {
        wideEventService.enrichBusinessContext({ sessionId: 'fast' });
        await setTimeout(1);
      }),
    ]);

    const lines = logger.info.mock.calls.map(([line]) => line);
    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.sessionId).sort()).toEqual([
      'fast',
      'slow',
    ]);
    expect(new Set(lines.map((line) => line.requestId)).size).toBe(2);
  });
});
