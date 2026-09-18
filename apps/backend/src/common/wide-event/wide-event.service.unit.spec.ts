import { ErrorCode } from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common';
import type { ClsService } from 'nestjs-cls';
import type {
  HttpWideEventInit,
  WideEventAuthContext,
  WideEventLogger,
  WideEventOperationContext,
} from './wide-event';
import { type WideEventClsStore, WideEventService } from './wide-event.service';

function buildWideEventService() {
  const clsService = createMock<ClsService<WideEventClsStore>>();
  const logger = createMock<WideEventLogger>();
  const wideEventService = new WideEventService(clsService, logger);

  return { clsService, logger, wideEventService };
}

describe('WideEventService', () => {
  describe('run', () => {
    it('runs the callback inside an initialized context', () => {
      const { clsService, wideEventService } = buildWideEventService();
      const init = {
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
      } satisfies HttpWideEventInit;
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
  });

  describe('enrichAuth', () => {
    it('enriches the active event with authentication data', () => {
      const { clsService, wideEventService } = buildWideEventService();
      const authData = {
        isAuthenticated: true,
        userId: 'user-1',
      } satisfies WideEventAuthContext;
      const init = {
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
      } satisfies HttpWideEventInit;
      clsService.get.mockReturnValueOnce(init).mockReturnValueOnce(false);

      wideEventService.enrichAuth(authData);

      expect(clsService.set).toHaveBeenCalledWith('wideEvent', {
        ...init,
        isAuthenticated: true,
        userId: 'user-1',
      });
    });
  });

  describe('finish', () => {
    it('finalizes an HTTP event once with its resolved route', () => {
      const { clsService, logger, wideEventService } = buildWideEventService();
      const outcome = { route: '/v1/session/:id', statusCode: 201 };
      const init = {
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
      } satisfies HttpWideEventInit;
      clsService.get
        .mockReturnValueOnce(init)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(0n);

      wideEventService.finish(outcome);

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
  });

  describe('recordError', () => {
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
          domain: 'other',
          operation: 'test',
          statusCode: 400,
          outcome: 'client_error',
          errorCode: ErrorCode.BAD_REQUEST,
        }),
        'operation error',
      );
    });
  });

  describe('recordOperationError', () => {
    it('logs an operation error without enriching the active event', () => {
      const { clsService, logger, wideEventService } = buildWideEventService();
      const operation = {
        domain: 'auth',
        operation: 'send_verification_email',
        userId: 'user-1',
      } satisfies WideEventOperationContext;
      const init = {
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
      } satisfies HttpWideEventInit;
      clsService.get.mockReturnValue(init);

      wideEventService.recordOperationError(
        new Error('Mailer unavailable'),
        operation,
      );

      expect(clsService.set).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'operation_error',
          requestId: 'request-1',
          domain: 'auth',
          operation: 'send_verification_email',
          userId: 'user-1',
          statusCode: 500,
          outcome: 'server_error',
          errorCode: ErrorCode.UNKNOWN_ERROR,
          errorMessage: 'Mailer unavailable',
          errorStack: expect.any(String),
        }),
        'operation error',
      );
    });
  });
});
