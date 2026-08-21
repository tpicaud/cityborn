import { defaultGuess, ErrorCode } from '@cityborn/api';
import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { extractAccessTokenFromWsClient } from '../auth/utils';
import type { SessionSocket } from '../common/types/session-socket';
import type { ConnectionRegistryService } from '../connection-registry/connection-registry.service';
import type { RateLimitService } from '../rate-limit/rate-limit.service';
import type { UserService } from '../user/user.service';
import { SessionGateway } from './session.gateway';
import type { SessionService } from './session.service';

jest.mock('../auth/utils', () => ({
  extractAccessTokenFromWsClient: jest.fn(),
}));
jest.mock('../auth/guards/utils', () => ({
  validateAccessToken: jest.fn(),
  resolveFullUser: jest.fn(),
}));
jest.mock('./session.service', () => ({
  SessionService: class {},
}));

const { validateAccessToken, resolveFullUser } = jest.requireMock(
  '../auth/guards/utils',
);

describe('SessionGateway', () => {
  const socket = { id: 'socket-1' } as unknown as Socket;

  const resolvedConnection = {
    playerID: 'p1',
    sessionID: 's1',
    isGuest: false,
  };

  const buildGateway = (
    sessionService: Partial<SessionService>,
    connectionRegistryService: Partial<ConnectionRegistryService> = {
      getConnection: jest.fn().mockResolvedValue(resolvedConnection),
    },
    rateLimitService: Partial<RateLimitService> = {
      consumeWsConnection: jest.fn().mockResolvedValue(undefined),
      consumeWsMessage: jest.fn().mockResolvedValue(undefined),
    },
  ) => {
    const gateway = new SessionGateway(
      sessionService as unknown as SessionService,
      { get: jest.fn() } as unknown as ConfigService,
      {} as unknown as JwtService,
      {} as unknown as UserService,
      connectionRegistryService as unknown as ConnectionRegistryService,
      rateLimitService as unknown as RateLimitService,
    );
    gateway.io = { to: () => ({ emit: jest.fn() }) } as unknown as Server;
    return gateway;
  };

  describe('handleGuess', () => {
    it('propagates a raw (non-Nest) error thrown by the service', async () => {
      const sessionService = {
        handleGuess: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      };
      const gateway = buildGateway(sessionService);

      await expect(gateway.handleGuess(socket, defaultGuess)).rejects.toThrow(
        'ECONNREFUSED',
      );
    });

    it('propagates a Nest HttpException thrown by the service unchanged', async () => {
      const exception = new NotFoundException({
        code: ErrorCode.SESSION_NOT_FOUND,
        message: 'Session not found',
      });
      const sessionService = {
        handleGuess: jest.fn().mockRejectedValue(exception),
      };
      const gateway = buildGateway(sessionService);

      await expect(gateway.handleGuess(socket, defaultGuess)).rejects.toBe(
        exception,
      );
    });

    it('throws CONNECTION_NOT_FOUND when the socket has no registered connection', async () => {
      const sessionService = { handleGuess: jest.fn() };
      const gateway = buildGateway(sessionService, {
        getConnection: jest.fn().mockResolvedValue(null),
      });

      await expect(
        gateway.handleGuess(socket, defaultGuess),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ErrorCode.CONNECTION_NOT_FOUND,
        }),
      });
      expect(sessionService.handleGuess).not.toHaveBeenCalled();
    });
  });

  describe('startGame', () => {
    it('propagates a raw error thrown by the service (shared behavior across handlers)', async () => {
      const sessionService = {
        startGame: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      };
      const gateway = buildGateway(sessionService);

      await expect(gateway.startGame(socket)).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('handleConnection', () => {
    it('degrades to a guest connection when resolveFullUser fails, instead of throwing', async () => {
      jest.mocked(extractAccessTokenFromWsClient).mockReturnValue('a-token');
      jest.mocked(validateAccessToken).mockResolvedValue({ id: 'user-1' });
      jest.mocked(resolveFullUser).mockRejectedValue(new Error('DB down'));

      const gateway = buildGateway({});
      const client = {
        handshake: { query: {}, headers: {}, address: '127.0.0.1' },
        data: {},
      } as unknown as SessionSocket;

      await expect(gateway.handleConnection(client)).resolves.not.toThrow();
      expect(client.data.user).toBeUndefined();
    });

    it('sets client.data.user when resolveFullUser succeeds', async () => {
      const user = { id: 'user-1' };
      jest.mocked(extractAccessTokenFromWsClient).mockReturnValue('a-token');
      jest.mocked(validateAccessToken).mockResolvedValue({ id: 'user-1' });
      jest.mocked(resolveFullUser).mockResolvedValue(user);

      const gateway = buildGateway({});
      const client = {
        handshake: { query: {}, headers: {}, address: '127.0.0.1' },
        data: {},
      } as unknown as SessionSocket;

      await gateway.handleConnection(client);

      expect(client.data.user).toBe(user);
    });
  });
});
