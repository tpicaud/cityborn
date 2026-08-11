import { defaultGuess, ErrorCode } from '@cityborn/api';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import type { UserService } from '../user/user.service';
import { SessionGateway } from './session.gateway';
import type { SessionService } from './session.service';

jest.mock('../auth/utils', () => ({
  extractAccessTokenFromWsClient: jest.fn(),
}));
jest.mock('./session.service', () => ({
  SessionService: class {},
}));

describe('SessionGateway', () => {
  const socket = { id: 'socket-1' } as unknown as Socket;

  const buildGateway = (sessionService: Partial<SessionService>) => {
    const gateway = new SessionGateway(
      sessionService as unknown as SessionService,
      {} as unknown as ConfigService,
      {} as unknown as JwtService,
      {} as unknown as UserService,
    );
    gateway.io = { to: () => ({ emit: jest.fn() }) } as unknown as Server;
    return gateway;
  };

  describe('handleGuess', () => {
    it('returns a clean UNKNOWN_ERROR response when the service throws a raw (non-Nest) error', async () => {
      const sessionService = {
        handleGuess: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      };
      const gateway = buildGateway(sessionService);

      await expect(gateway.handleGuess(socket, defaultGuess)).resolves.toEqual({
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'ECONNREFUSED',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
      });
    });

    it('still returns the specific error code when the service throws a Nest HttpException', async () => {
      const sessionService = {
        handleGuess: jest.fn().mockRejectedValue(
          new NotFoundException({
            code: ErrorCode.SESSION_NOT_FOUND,
            message: 'Session not found',
          }),
        ),
      };
      const gateway = buildGateway(sessionService);

      await expect(gateway.handleGuess(socket, defaultGuess)).resolves.toEqual({
        success: false,
        error: {
          code: ErrorCode.SESSION_NOT_FOUND,
          message: 'Session not found',
          statusCode: HttpStatus.NOT_FOUND,
        },
      });
    });
  });

  describe('startGame', () => {
    it('also returns a clean UNKNOWN_ERROR response on a raw error (shared fix across handlers)', async () => {
      const sessionService = {
        startGame: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      };
      const gateway = buildGateway(sessionService);

      await expect(gateway.startGame(socket)).resolves.toEqual({
        success: false,
        error: {
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'ECONNREFUSED',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
      });
    });
  });
});
