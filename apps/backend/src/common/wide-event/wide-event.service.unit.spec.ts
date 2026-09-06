import { ErrorCode } from '@cityborn/api';
import { BadRequestException } from '@nestjs/common';
import type { ClsService } from 'nestjs-cls';
import { createMock } from '../../../test/support/createMock';
import type { HttpWideEventInit, WideEventLogger } from './wide-event';
import { type WideEventClsStore, WideEventService } from './wide-event.service';

function buildHttpWideEvent(
  overrides: Partial<HttpWideEventInit> = {},
): HttpWideEventInit {
  return {
    transport: 'http',
    requestId: 'request-1',
    domain: 'other',
    operation: 'GET /pending',
    method: 'GET',
    route: '/pending',
    ip: '127.0.0.1',
    userAgent: undefined,
    visitorId: undefined,
    client: undefined,
    clientVersion: undefined,
    apiVersion: 1,
    isAuthenticated: false,
    ...overrides,
  };
}

function buildWideEventService() {
  const clsService = createMock<ClsService<WideEventClsStore>>();
  const logger = createMock<WideEventLogger>();
  const wideEventService = new WideEventService(clsService, logger);

  return { clsService, logger, wideEventService };
}

describe('WideEventService', () => {
  it('runs the callback inside an initialized context', () => {
    const { clsService, wideEventService } = buildWideEventService();
    const init = buildHttpWideEvent();
    clsService.runWith.mockImplementation((_store, callback) => callback());

    const result = wideEventService.run(init, () => 'result');

    expect(result).toBe('result');
    expect(clsService.runWith).toHaveBeenCalledWith(
      expect.objectContaining({
        wideEvent: init,
        finalized: false,
        startedAt: expect.any(BigInt),
      }),
      expect.any(Function),
    );
  });

  it('enriches the active event with authentication data', () => {
    const { clsService, wideEventService } = buildWideEventService();
    const init = buildHttpWideEvent();
    clsService.get.mockReturnValueOnce(init).mockReturnValueOnce(false);

    wideEventService.enrichAuth({
      isAuthenticated: true,
      userId: 'user-1',
    });

    expect(clsService.set).toHaveBeenCalledWith('wideEvent', {
      ...init,
      isAuthenticated: true,
      userId: 'user-1',
    });
  });

  it('finalizes an HTTP event once with its resolved route', () => {
    const { clsService, logger, wideEventService } = buildWideEventService();
    const init = buildHttpWideEvent();
    clsService.get
      .mockReturnValueOnce(init)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(0n);

    wideEventService.finish({ route: '/v1/session/:id', statusCode: 201 });

    expect(clsService.set).toHaveBeenCalledWith('finalized', true);
    expect(clsService.set).toHaveBeenCalledWith(
      'wideEvent',
      expect.objectContaining({
        route: '/v1/session/:id',
        domain: 'session',
        operation: 'GET /v1/session/:id',
        statusCode: 201,
        outcome: 'success',
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'http_request', statusCode: 201 }),
      'request',
    );
  });

  it('logs an error immediately when no context is active', () => {
    const { clsService, logger, wideEventService } = buildWideEventService();
    clsService.get.mockReturnValue(undefined);

    const apiError = wideEventService.recordError(
      new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Invalid request',
      }),
      'test',
    );

    expect(apiError).toMatchObject({
      statusCode: 400,
      code: ErrorCode.BAD_REQUEST,
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'operation_error',
        source: 'test',
        statusCode: 400,
      }),
      'operation error',
    );
  });
});
