import type { PlayerId, SessionId } from '@cityborn/api';
import { ErrorCode, PlayerIdSchema, SessionIdSchema } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import type { WideEventService } from '../common/wide-event/wide-event.service';
import type { ConnectionRegistryService } from '../connection-registry/connection-registry.service';
import type { RateLimitService } from '../rate-limit/rate-limit.service';
import type { UserService } from '../user/user.service';
import { SessionGateway } from './session.gateway';
import type { SessionService } from './session.service';

function buildSessionGateway() {
  const sessionService: DeepMocked<SessionService> =
    createMock<SessionService>();
  const connectionRegistryService: DeepMocked<ConnectionRegistryService> =
    createMock<ConnectionRegistryService>();
  const sessionGateway: SessionGateway = new SessionGateway(
    sessionService,
    createMock<ConfigService>(),
    createMock<JwtService>(),
    createMock<UserService>(),
    connectionRegistryService,
    createMock<RateLimitService>(),
    createMock<WideEventService>(),
  );

  return { sessionGateway, sessionService, connectionRegistryService };
}

describe('SessionGateway client payload validation', () => {
  describe('updateGameConfig', () => {
    it('rejects an invalid game configuration as a bad request', async () => {
      const {
        sessionGateway,
        sessionService,
        connectionRegistryService,
      }: ReturnType<typeof buildSessionGateway> = buildSessionGateway();
      const socket: DeepMocked<Socket> = createMock<Socket>({ id: 'socket-1' });
      const invalidConfig: { timer: string } = { timer: 'fast' };

      await expect(
        sessionGateway.updateGameConfig(socket, invalidConfig),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.BAD_REQUEST },
      });
      expect(connectionRegistryService.getConnection).not.toHaveBeenCalled();
      expect(sessionService.updateGameConfig).not.toHaveBeenCalled();
    });

    it('normalizes a valid game configuration before the service call', async () => {
      const {
        sessionGateway,
        sessionService,
        connectionRegistryService,
      }: ReturnType<typeof buildSessionGateway> = buildSessionGateway();
      const socket: DeepMocked<Socket> = createMock<Socket>({ id: 'socket-1' });
      const config: {
        categories: never[];
        timer: number;
        nbOfObjects: number;
        ignored: boolean;
      } = {
        categories: [],
        timer: 30,
        nbOfObjects: 5,
        ignored: true,
      };
      const playerID: PlayerId = PlayerIdSchema.parse('alice');
      const sessionID: SessionId = SessionIdSchema.parse('session-1');
      const serviceError: Error = new Error('stop after service call');
      connectionRegistryService.getConnection.mockResolvedValue({
        playerID,
        sessionID,
        isGuest: false,
      });
      sessionService.updateGameConfig.mockRejectedValue(serviceError);

      await expect(
        sessionGateway.updateGameConfig(socket, config),
      ).rejects.toBe(serviceError);
      expect(sessionService.updateGameConfig).toHaveBeenCalledWith(
        playerID,
        sessionID,
        { categories: [], timer: 30, nbOfObjects: 5 },
      );
    });
  });

  describe('handleGuess', () => {
    it('rejects an invalid guess before resolving the connection', async () => {
      const {
        sessionGateway,
        sessionService,
        connectionRegistryService,
      }: ReturnType<typeof buildSessionGateway> = buildSessionGateway();
      const socket: DeepMocked<Socket> = createMock<Socket>({ id: 'socket-1' });
      const invalidGuess: {
        coordinates: { lat: string; lng: number };
        distance: number;
        points: number;
        win: boolean;
      } = {
        coordinates: { lat: 'north', lng: 2 },
        distance: 10,
        points: 100,
        win: false,
      };

      await expect(
        sessionGateway.handleGuess(socket, invalidGuess),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.BAD_REQUEST },
      });
      expect(connectionRegistryService.getConnection).not.toHaveBeenCalled();
      expect(sessionService.handleGuess).not.toHaveBeenCalled();
    });
  });
});
