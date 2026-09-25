import { AsyncLocalStorage } from 'node:async_hooks';
import type { ApiError } from '@cityborn/api';
import { ErrorCode } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import type {
  HttpWideEventInit,
  WideEventAuthContext,
  WideEventFinalization,
  WideEventLogger,
  WideEventOperationContext,
} from './wide-event';
import { type WideEventClsStore, WideEventService } from './wide-event.service';

function buildWideEventService() {
  const clsService: DeepMocked<ClsService<WideEventClsStore>> =
    createMock<ClsService<WideEventClsStore>>();
  const logger: DeepMocked<WideEventLogger> = createMock<WideEventLogger>();
  const wideEventService: WideEventService = new WideEventService(
    clsService,
    logger,
  );

  return { clsService, logger, wideEventService };
}

describe('WideEventService', () => {
  describe('run', () => {
    it('runs the callback inside an initialized context', () => {
      const {
        clsService,
        wideEventService,
      }: ReturnType<typeof buildWideEventService> = buildWideEventService();
      const init: HttpWideEventInit = {
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
      };
      clsService.runWith.mockImplementation((_store, callback) => callback());

      const result: string = wideEventService.run(init, () => 'result');

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
      const {
        clsService,
        wideEventService,
      }: ReturnType<typeof buildWideEventService> = buildWideEventService();
      const authData: WideEventAuthContext = {
        isAuthenticated: true,
        userId: 'user-1',
      };
      const init: HttpWideEventInit = {
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
      };
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
    it.each([401, 429])(
      'keeps the HTTP action when a guard rejects with %i',
      (statusCode: number) => {
        const {
          clsService,
          logger,
          wideEventService,
        }: ReturnType<typeof buildWideEventService> = buildWideEventService();
        const outcome: WideEventFinalization = {
          route: '/session/:id',
          statusCode,
        };
        const init: HttpWideEventInit = {
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
        };
        clsService.get
          .mockReturnValueOnce(init)
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(0n);

        wideEventService.finish(outcome);

        expect(clsService.set).toHaveBeenCalledWith('finalized', true);
        expect(clsService.set).toHaveBeenCalledWith(
          'wideEvent',
          expect.objectContaining({
            route: '/session/:id',
            domain: 'session',
            operation: 'GET /session/:id',
            action: 'session.getSession',
            statusCode,
            outcome: 'client_error',
          }),
        );
        expect(logger.warn).toHaveBeenCalledWith(
          expect.objectContaining({ event: 'http_request', statusCode }),
          'request',
        );
      },
    );
  });

  describe('recordError', () => {
    it('logs an error immediately when no context is active', () => {
      const {
        clsService,
        logger,
        wideEventService,
      }: ReturnType<typeof buildWideEventService> = buildWideEventService();
      clsService.get.mockReturnValue(undefined);

      const apiError: ApiError = wideEventService.recordError(
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

    it('retains error details across a nested CLS context', () => {
      const clsService: ClsService<WideEventClsStore> = new ClsService(
        new AsyncLocalStorage<WideEventClsStore>(),
      );
      const logger: DeepMocked<WideEventLogger> = createMock<WideEventLogger>();
      const wideEventService: WideEventService = new WideEventService(
        clsService,
        logger,
      );
      const init: HttpWideEventInit = {
        transport: 'http',
        requestId: 'request-1',
        domain: 'auth',
        operation: 'POST /auth/sign-up',
        action: 'auth.signUp',
        method: 'POST',
        route: '/auth/sign-up',
        ip: '127.0.0.1',
        userAgent: undefined,
        visitorId: undefined,
        client: 'web',
        clientVersion: undefined,
        apiVersion: 4,
        isAuthenticated: false,
      };

      wideEventService.run(init, () => {
        clsService.run(() => {
          wideEventService.recordError(new Error('Database column missing'));
        });
        wideEventService.finish({
          route: '/auth/sign-up',
          statusCode: 500,
        });
      });

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'http_request',
          statusCode: 500,
          errorCode: ErrorCode.UNKNOWN_ERROR,
          errorMessage: 'Database column missing',
          errorStack: expect.any(String),
        }),
        'request',
      );
    });
  });

  describe('recordOperationError', () => {
    it('logs an operation error without enriching the active event', () => {
      const {
        clsService,
        logger,
        wideEventService,
      }: ReturnType<typeof buildWideEventService> = buildWideEventService();
      const operation: WideEventOperationContext = {
        domain: 'auth',
        operation: 'send_verification_email',
        userId: 'user-1',
      };
      const init: HttpWideEventInit = {
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
      };
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
