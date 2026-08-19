import { defaultGuess, ErrorCode } from '@cityborn/api';
import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { extractAccessTokenFromWsClient } from '../auth/utils';
import type { SessionSocket } from '../common/types/session-socket';
import type { PlayerService } from '../player/player.service';
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

  const resolvedPlayer = { playerID: 'p1', sessionID: 's1', isGuest: false };

  const buildGateway = (
    sessionService: Partial<SessionService>,
    playerService: Partial<PlayerService> = {
      getPlayer: jest.fn().mockResolvedValue(resolvedPlayer),
    },
  ) => {
    const gateway = new SessionGateway(
      sessionService as unknown as SessionService,
      { get: jest.fn() } as unknown as ConfigService,
      {} as unknown as JwtService,
      {} as unknown as UserService,
      playerService as unknown as PlayerService,
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

    it('throws PLAYER_NOT_FOUND when the socket has no registered player', async () => {
      const sessionService = { handleGuess: jest.fn() };
      const gateway = buildGateway(sessionService, {
        getPlayer: jest.fn().mockResolvedValue(null),
      });

      await expect(
        gateway.handleGuess(socket, defaultGuess),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: ErrorCode.PLAYER_NOT_FOUND,
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
    // Ce hook échappe au pipeline Nest (pas de filtre/interceptor
    // possible) : il doit gérer ses erreurs lui-même. On vérifie ici la
    // dégradation en invité choisie plutôt qu'une déconnexion brutale.
    it('degrades to a guest connection when resolveFullUser fails, instead of throwing', async () => {
      jest.mocked(extractAccessTokenFromWsClient).mockReturnValue('a-token');
      jest.mocked(validateAccessToken).mockResolvedValue({ id: 'user-1' });
      jest.mocked(resolveFullUser).mockRejectedValue(new Error('DB down'));

      const gateway = buildGateway({});
      const client = {
        handshake: { query: {} },
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
        handshake: { query: {} },
        data: {},
      } as unknown as SessionSocket;

      await gateway.handleConnection(client);

      expect(client.data.user).toBe(user);
    });
  });
});
