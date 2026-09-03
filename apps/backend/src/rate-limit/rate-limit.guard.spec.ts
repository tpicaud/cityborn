import { ErrorCode } from '@cityborn/api';
import { type ExecutionContext, HttpException } from '@nestjs/common';
import type { Request } from 'express';
import { type ClsService, ClsServiceManager } from 'nestjs-cls';
import type { SessionSocket } from '../common/types/session-socket';
import {
  type WideEventClsStore,
  WideEventService,
} from '../common/wide-event/wide-event.service';
import type { ConnectionRegistryService } from '../connection-registry/connection-registry.service';
import { RateLimitGuard } from './rate-limit.guard';
import type { RateLimitService } from './rate-limit.service';

describe('RateLimitGuard', () => {
  const buildGuard = (
    rateLimitService: Partial<RateLimitService> = {
      consumeHttp: jest.fn().mockResolvedValue(undefined),
      consumeWsMessage: jest.fn().mockResolvedValue(undefined),
    },
    connectionRegistryService: Partial<ConnectionRegistryService> = {
      getConnection: jest.fn().mockResolvedValue(null),
    },
    wideEventService: Partial<WideEventService> = {
      set: jest.fn(),
      enrich: jest.fn(),
      complete: jest.fn(),
    },
  ) => {
    const rateLimitGuard = new RateLimitGuard(
      rateLimitService as unknown as RateLimitService,
      connectionRegistryService as unknown as ConnectionRegistryService,
      wideEventService as unknown as WideEventService,
      { enter: jest.fn() } as unknown as ClsService<WideEventClsStore>,
    );
    return {
      rateLimitGuard,
      rateLimitService,
      connectionRegistryService,
      wideEventService,
    };
  };

  const buildHttpContext = (request: Partial<Request>): ExecutionContext =>
    ({
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  const buildWsContext = (client: Partial<SessionSocket>): ExecutionContext =>
    ({
      getType: () => 'ws',
      switchToWs: () => ({
        getClient: () => client,
        getPattern: () => 'session:guess',
      }),
    }) as unknown as ExecutionContext;

  describe('Right paths', () => {
    it('consumes an IP+route key for HTTP requests', async () => {
      const { rateLimitGuard: guard, rateLimitService } = buildGuard();
      const context = buildHttpContext({
        ip: '1.2.3.4',
        method: 'POST',
        route: { path: '/auth/sign-in' } as Request['route'],
        url: '/auth/sign-in',
      });

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(rateLimitService.consumeHttp).toHaveBeenCalledWith(
        '1.2.3.4:POST:/auth/sign-in',
      );
    });

    it('enriches the wide event with the http rate limit bucket and remaining points', async () => {
      const { rateLimitGuard: guard, wideEventService } = buildGuard({
        consumeHttp: jest.fn().mockResolvedValue({ remainingPoints: 42 }),
      });
      const context = buildHttpContext({
        ip: '1.2.3.4',
        method: 'GET',
        route: { path: '/health' } as Request['route'],
        url: '/health',
      });

      await guard.canActivate(context);

      expect(wideEventService.enrich).toHaveBeenLastCalledWith({
        rateLimitRemaining: 42,
      });
    });

    it('consumes the playerID as key when the WS connection is registered', async () => {
      const {
        rateLimitGuard: guard,
        rateLimitService,
        connectionRegistryService,
        wideEventService,
      } = buildGuard(undefined, {
        getConnection: jest.fn().mockResolvedValue({
          playerID: 'player-1',
          sessionID: 's1',
          isGuest: false,
        }),
      });
      const context = buildWsContext({
        id: 'socket-1',
        handshake: { headers: {}, address: '5.6.7.8' },
        data: {},
      } as unknown as SessionSocket);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(connectionRegistryService.getConnection).toHaveBeenCalledWith(
        'socket-1',
      );
      expect(rateLimitService.consumeWsMessage).toHaveBeenCalledWith(
        'player-1',
      );
      expect(wideEventService.enrich).toHaveBeenLastCalledWith({
        rateLimitRemaining: undefined,
      });
    });

    it('falls back to the client IP when the WS connection is not registered yet', async () => {
      const { rateLimitGuard: guard, rateLimitService } = buildGuard();
      const context = buildWsContext({
        id: 'socket-1',
        handshake: { headers: {}, address: '5.6.7.8' },
        data: {},
      } as unknown as SessionSocket);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(rateLimitService.consumeWsMessage).toHaveBeenCalledWith('5.6.7.8');
    });

    it('completes the wide event when the WS message is rate limited', async () => {
      const rejection = new HttpException('Too many requests', 429);
      const { rateLimitGuard: guard, wideEventService } = buildGuard({
        consumeWsMessage: jest.fn().mockRejectedValue(rejection),
      });
      const context = buildWsContext({
        id: 'socket-1',
        handshake: { headers: {}, address: '5.6.7.8' },
        data: {},
      } as unknown as SessionSocket);

      await expect(guard.canActivate(context)).rejects.toBe(rejection);
      expect(wideEventService.enrich).toHaveBeenCalledWith({
        rateLimitBucket: 'rl:ws:msg',
      });
      expect(wideEventService.complete).toHaveBeenCalledWith({
        statusCode: 429,
        outcome: 'client_error',
      });
    });

    it('emits exactly one WS rate limit line', async () => {
      const rejection = new HttpException(
        {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests',
        },
        429,
      );
      const rateLimitService = {
        consumeWsMessage: jest.fn().mockRejectedValue(rejection),
      };
      const connectionRegistryService = {
        getConnection: jest.fn().mockResolvedValue(null),
      };
      const logger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const cls = ClsServiceManager.getClsService<WideEventClsStore>();
      const wideEventService = new WideEventService(cls, logger);
      const guard = new RateLimitGuard(
        rateLimitService as unknown as RateLimitService,
        connectionRegistryService as unknown as ConnectionRegistryService,
        wideEventService,
        cls,
      );
      const context = buildWsContext({
        id: 'socket-1',
        handshake: { headers: {}, address: '5.6.7.8' },
        data: {},
      } as unknown as SessionSocket);

      await expect(guard.canActivate(context)).rejects.toBe(rejection);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'ws_message',
          statusCode: 429,
          outcome: 'client_error',
          rateLimitBucket: 'rl:ws:msg',
          errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
        }),
        'message',
      );
    });
  });
});
