jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'rid') }));

import { ErrorCode } from '@cityborn/api';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { lastValueFrom, of, throwError } from 'rxjs';
import {
  type WideEventClsStore,
  WideEventService,
} from '../wide-event/wide-event.service';
import { WsErrorInterceptor } from './ws-error.interceptor';
import { WsWideEventInterceptor } from './ws-wide-event.interceptor';

const buildLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const wsContext = (pattern = 'session:guess'): ExecutionContext =>
  ({
    getType: () => 'ws',
    switchToWs: () => ({
      getClient: () => ({
        id: 'socket-1',
        handshake: { headers: { 'user-agent': 'jest' }, address: '1.2.3.4' },
        data: {},
      }),
      getData: () => ({}),
      getPattern: () => pattern,
    }),
  }) as unknown as ExecutionContext;

describe('ws wide event integration — one line per message, error folded in', () => {
  const run = (handler: CallHandler) => {
    const logger = buildLogger();
    const cls = ClsServiceManager.getClsService<WideEventClsStore>();
    const wideEventService = new WideEventService(cls, logger);
    const wsWideEvent = new WsWideEventInterceptor(wideEventService, cls);
    const wsError = new WsErrorInterceptor(wideEventService);
    const ctx = wsContext();

    const result = lastValueFrom(
      wsWideEvent.intercept(ctx, {
        handle: () => wsError.intercept(ctx, handler),
      }),
    );
    return { result, logger };
  };

  it('emits exactly one info line for a message that succeeds', async () => {
    const { result, logger } = run({ handle: () => of({ success: true }) });

    await expect(result).resolves.toEqual({ success: true });
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ws_message',
        eventName: 'session:guess',
      }),
      'message',
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('emits exactly one warn line for a mapped 4xx, carrying the error, and no separate log', async () => {
    const failure = new NotFoundException({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: 'Session not found',
    });
    const { result, logger } = run({ handle: () => throwError(() => failure) });

    await expect(result).resolves.toEqual({
      success: false,
      error: {
        statusCode: 404,
        code: ErrorCode.SESSION_NOT_FOUND,
        message: 'Session not found',
      },
    });
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'ws_message',
        statusCode: 404,
        errorCode: ErrorCode.SESSION_NOT_FOUND,
        errorMessage: 'Session not found',
      }),
      'message',
    );
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('emits exactly one error line with a stack for an unexpected 5xx', async () => {
    const { result, logger } = run({
      handle: () => throwError(() => new Error('kaboom')),
    });

    await expect(result).resolves.toMatchObject({
      success: false,
      error: { code: ErrorCode.UNKNOWN_ERROR },
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
    const [payload] = logger.error.mock.calls[0];
    expect(payload).toMatchObject({
      event: 'ws_message',
      statusCode: 500,
      errorCode: ErrorCode.UNKNOWN_ERROR,
      errorMessage: 'kaboom',
    });
    expect(typeof payload.errorStack).toBe('string');
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
