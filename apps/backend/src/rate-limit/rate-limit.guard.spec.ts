import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SessionSocket } from '../common/types/session-socket';
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
  ) => {
    const rateLimitGuard = new RateLimitGuard(
      rateLimitService as unknown as RateLimitService,
      connectionRegistryService as unknown as ConnectionRegistryService,
    );
    return { rateLimitGuard, rateLimitService, connectionRegistryService };
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
  });
});
