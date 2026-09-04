import { ErrorCode } from '@cityborn/api';
import {
  type ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import type { SessionSocket } from '../common/types/session-socket';
import type { WideEventService } from '../common/wide-event/wide-event.service';
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
      enrichRateLimit: jest.fn(),
    },
  ) => {
    const rateLimitGuard = new RateLimitGuard(
      rateLimitService as unknown as RateLimitService,
      connectionRegistryService as unknown as ConnectionRegistryService,
      wideEventService as unknown as WideEventService,
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

      expect(wideEventService.enrichRateLimit).toHaveBeenCalledWith({
        rateLimitBucket: 'rl:http',
        rateLimitRemaining: 42,
        rateLimitStatus: 'allowed',
      });
    });

    it('consumes the playerID as key when the WS connection is registered', async () => {
      const {
        rateLimitGuard: guard,
        rateLimitService,
        connectionRegistryService,
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
      } as unknown as SessionSocket);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(connectionRegistryService.getConnection).toHaveBeenCalledWith(
        'socket-1',
      );
      expect(rateLimitService.consumeWsMessage).toHaveBeenCalledWith(
        'player-1',
      );
    });

    it('falls back to the client IP when the WS connection is not registered yet', async () => {
      const { rateLimitGuard: guard, rateLimitService } = buildGuard();
      const context = buildWsContext({
        id: 'socket-1',
        handshake: { headers: {}, address: '5.6.7.8' },
      } as unknown as SessionSocket);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(rateLimitService.consumeWsMessage).toHaveBeenCalledWith('5.6.7.8');
    });
    it('enriches rejected HTTP rate limits before rethrowing the 429', async () => {
      const failure = new HttpException(
        {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
      const { rateLimitGuard: guard, wideEventService } = buildGuard({
        consumeHttp: jest.fn().mockRejectedValue(failure),
      });
      const context = buildHttpContext({
        ip: '1.2.3.4',
        method: 'GET',
        route: { path: '/health' } as Request['route'],
        url: '/health',
      });

      await expect(guard.canActivate(context)).rejects.toBe(failure);
      expect(wideEventService.enrichRateLimit).toHaveBeenCalledWith({
        rateLimitBucket: 'rl:http',
        rateLimitRemaining: 0,
        rateLimitStatus: 'rejected',
      });
    });

    it('enriches allowed and rejected WS message rate limits', async () => {
      const allowed = buildGuard({
        consumeWsMessage: jest.fn().mockResolvedValue({ remainingPoints: 12 }),
      });
      const client = {
        id: 'socket-1',
        handshake: { headers: {}, address: '5.6.7.8' },
      } as unknown as SessionSocket;
      const context = buildWsContext(client);

      await allowed.rateLimitGuard.canActivate(context);
      expect(allowed.wideEventService.enrichRateLimit).toHaveBeenCalledWith({
        rateLimitBucket: 'rl:ws:msg',
        rateLimitRemaining: 12,
        rateLimitStatus: 'allowed',
      });

      const failure = new HttpException(
        {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
      const rejected = buildGuard({
        consumeWsMessage: jest.fn().mockRejectedValue(failure),
      });

      await expect(rejected.rateLimitGuard.canActivate(context)).rejects.toBe(
        failure,
      );
      expect(rejected.wideEventService.enrichRateLimit).toHaveBeenCalledWith({
        rateLimitBucket: 'rl:ws:msg',
        rateLimitRemaining: 0,
        rateLimitStatus: 'rejected',
      });
    });
  });
});
