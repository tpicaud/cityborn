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

const httpWideEventInit: HttpWideEventInit = {
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

function buildWideEventService() {
  const clsService: ClsService<WideEventClsStore> = new ClsService(
    new AsyncLocalStorage(),
  );
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
        logger,
        wideEventService,
      }: ReturnType<typeof buildWideEventService> = buildWideEventService();

      const result: string = wideEventService.run(httpWideEventInit, () => {
        wideEventService.finish({ route: '/health' });
        return 'result';
      });

      expect(result).toBe('result');
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'http_request',
          requestId: 'request-1',
          statusCode: 200,
          durationMs: expect.any(Number),
        }),
        'request',
      );
    });
  });

  describe('enrichAuth', () => {
    it('enriches the active event with authentication data', () => {
      const {
        logger,
        wideEventService,
      }: ReturnType<typeof buildWideEventService> = buildWideEventService();
      const authData: WideEventAuthContext = {
        isAuthenticated: true,
        userId: 'user-1',
      };

      wideEventService.run(httpWideEventInit, () => {
        wideEventService.enrichAuth(authData);
        wideEventService.finish();
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: true, userId: 'user-1' }),
        'request',
      );
    });

    it('keeps the enrichment made from a nested inherited context', async () => {
      const {
        clsService,
        logger,
        wideEventService,
      }: ReturnType<typeof buildWideEventService> = buildWideEventService();
      const authData: WideEventAuthContext = {
        isAuthenticated: true,
        userId: 'user-1',
      };

      await wideEventService.run(httpWideEventInit, async () => {
        await clsService.run({ ifNested: 'inherit' }, async () => {
          wideEventService.enrichAuth(authData);
        });
        wideEventService.finish();
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: true, userId: 'user-1' }),
        'request',
      );
    });
  });

  describe('finish', () => {
    it.each([401, 429])(
      'keeps the HTTP action when a guard rejects with %i',
      (statusCode: number) => {
        const {
          logger,
          wideEventService,
        }: ReturnType<typeof buildWideEventService> = buildWideEventService();
        const outcome: WideEventFinalization = {
          route: '/session/:id',
          statusCode,
        };

        wideEventService.run(httpWideEventInit, () =>
          wideEventService.finish(outcome),
        );

        expect(logger.warn).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'http_request',
            route: '/session/:id',
            domain: 'session',
            operation: 'GET /session/:id',
            action: 'session.getSession',
            statusCode,
            outcome: 'client_error',
          }),
          'request',
        );
      },
    );

    it('emits the event only once', () => {
      const {
        logger,
        wideEventService,
      }: ReturnType<typeof buildWideEventService> = buildWideEventService();

      wideEventService.run(httpWideEventInit, () => {
        wideEventService.finish();
        wideEventService.enrichAuth({
          isAuthenticated: true,
          userId: 'user-1',
        });
        wideEventService.finish();
      });

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ isAuthenticated: false }),
        'request',
      );
    });
  });

  describe('recordError', () => {
    it('logs an error immediately when no context is active', () => {
      const {
        logger,
        wideEventService,
      }: ReturnType<typeof buildWideEventService> = buildWideEventService();

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
  });

  describe('recordOperationError', () => {
    it('logs an operation error without enriching the active event', () => {
      const {
        logger,
        wideEventService,
      }: ReturnType<typeof buildWideEventService> = buildWideEventService();
      const operation: WideEventOperationContext = {
        domain: 'auth',
        operation: 'send_verification_email',
        userId: 'user-1',
      };

      wideEventService.run(httpWideEventInit, () => {
        wideEventService.recordOperationError(
          new Error('Mailer unavailable'),
          operation,
        );
        wideEventService.finish();
      });

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
      expect(logger.info).toHaveBeenCalledWith(
        expect.not.objectContaining({ errorCode: expect.anything() }),
        'request',
      );
    });
  });
});
