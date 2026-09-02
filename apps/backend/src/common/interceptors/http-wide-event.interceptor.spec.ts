jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'rid') }));

import { EventEmitter } from 'node:events';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { firstValueFrom, of, throwError } from 'rxjs';
import type { WideEventService } from '../wide-event/wide-event.service';
import { HttpWideEventInterceptor } from './http-wide-event.interceptor';

const buildLogger = () => ({
  setContext: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const buildWideEventService = () => {
  let event: Record<string, unknown> = {
    transport: 'http',
    requestId: 'rid',
    method: 'GET',
  };
  return {
    enrich: jest.fn((fields: Record<string, unknown>) => {
      event = { ...event, ...fields };
    }),
    get: jest.fn(() => event),
  };
};

class FakeResponse extends EventEmitter {
  statusCode = 200;
}

const buildHttpContext = (
  response: FakeResponse,
  route?: string,
): ExecutionContext =>
  ({
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({ route: route ? { path: route } : undefined }),
      getResponse: () => response,
    }),
  }) as unknown as ExecutionContext;

const successHandler: CallHandler = { handle: () => of({ ok: true }) };

describe('HttpWideEventInterceptor', () => {
  const buildInterceptor = () => {
    const logger = buildLogger();
    const wideEventService = buildWideEventService();
    const interceptor = new HttpWideEventInterceptor(
      wideEventService as unknown as WideEventService,
      logger as unknown as PinoLogger,
    );
    return { interceptor, logger, wideEventService };
  };

  it('emits a single info line once the response finishes (2xx)', async () => {
    const { interceptor, logger, wideEventService } = buildInterceptor();
    const response = new FakeResponse();

    await firstValueFrom(
      interceptor.intercept(buildHttpContext(response), successHandler),
    );
    response.emit('finish');

    expect(wideEventService.enrich).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 200,
        durationMs: expect.any(Number),
      }),
    );
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'rid',
        statusCode: 200,
        durationMs: expect.any(Number),
        event: 'http_request',
      }),
      'request',
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('enriches the templated route resolved after routing', async () => {
    const { interceptor, wideEventService } = buildInterceptor();
    const response = new FakeResponse();

    await firstValueFrom(
      interceptor.intercept(
        buildHttpContext(response, '/users/:id'),
        successHandler,
      ),
    );
    response.emit('finish');

    expect(wideEventService.enrich).toHaveBeenCalledWith(
      expect.objectContaining({ route: '/users/:id' }),
    );
  });

  it('emits a warn line for a 4xx response', async () => {
    const { interceptor, logger } = buildInterceptor();
    const response = new FakeResponse();
    response.statusCode = 404;

    await firstValueFrom(
      interceptor.intercept(buildHttpContext(response), successHandler),
    );
    response.emit('finish');

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('emits an error line for a 5xx response', async () => {
    const { interceptor, logger } = buildInterceptor();
    const response = new FakeResponse();
    response.statusCode = 503;

    await firstValueFrom(
      interceptor.intercept(buildHttpContext(response), successHandler),
    );
    response.emit('finish');

    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('emits only once when finish and close both fire', async () => {
    const { interceptor, logger } = buildInterceptor();
    const response = new FakeResponse();

    await firstValueFrom(
      interceptor.intercept(buildHttpContext(response), successHandler),
    );
    response.emit('finish');
    response.emit('close');

    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('emits the error line after the exception filter set the status, when the handler throws', async () => {
    const { interceptor, logger, wideEventService } = buildInterceptor();
    const response = new FakeResponse();
    const failure = new Error('boom');
    const errorHandler: CallHandler = {
      handle: () => throwError(() => failure),
    };

    await expect(
      firstValueFrom(
        interceptor.intercept(buildHttpContext(response), errorHandler),
      ),
    ).rejects.toBe(failure);

    response.statusCode = 500;
    response.emit('finish');

    expect(wideEventService.enrich).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
    );
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('does nothing for a non-http context', async () => {
    const { interceptor, logger } = buildInterceptor();
    const wsContext = {
      getType: () => 'ws',
    } as unknown as ExecutionContext;

    await firstValueFrom(interceptor.intercept(wsContext, successHandler));

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
