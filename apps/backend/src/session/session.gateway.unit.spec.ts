import { ErrorCode, PlayerIdSchema, SessionIdSchema } from '@cityborn/api';
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
  const sessionService = createMock<SessionService>();
  const connectionRegistryService = createMock<ConnectionRegistryService>();
  const sessionGateway = new SessionGateway(
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
  it('rejects an invalid game configuration as a bad request', async () => {
    const { sessionGateway, sessionService, connectionRegistryService } =
      buildSessionGateway();
    const socket = createMock<Socket>({ id: 'socket-1' });

    await expect(
      sessionGateway.updateGameConfig(socket, { timer: 'fast' }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.BAD_REQUEST },
    });
    expect(connectionRegistryService.getConnection).not.toHaveBeenCalled();
    expect(sessionService.updateGameConfig).not.toHaveBeenCalled();
  });

  it('normalizes a valid game configuration before the service call', async () => {
    const { sessionGateway, sessionService, connectionRegistryService } =
      buildSessionGateway();
    const socket = createMock<Socket>({ id: 'socket-1' });
    const playerID = PlayerIdSchema.parse('alice');
    const sessionID = SessionIdSchema.parse('session-1');
    const serviceError = new Error('stop after service call');
    connectionRegistryService.getConnection.mockResolvedValue({
      playerID,
      sessionID,
      isGuest: false,
    });
    sessionService.updateGameConfig.mockRejectedValue(serviceError);

    await expect(
      sessionGateway.updateGameConfig(socket, {
        categories: [],
        timer: 30,
        nbOfObjects: 5,
        ignored: true,
      }),
    ).rejects.toBe(serviceError);
    expect(sessionService.updateGameConfig).toHaveBeenCalledWith(
      playerID,
      sessionID,
      { categories: [], timer: 30, nbOfObjects: 5 },
    );
  });

  it('rejects an invalid guess before resolving the connection', async () => {
    const { sessionGateway, sessionService, connectionRegistryService } =
      buildSessionGateway();
    const socket = createMock<Socket>({ id: 'socket-1' });

    await expect(
      sessionGateway.handleGuess(socket, {
        coordinates: { lat: 'north', lng: 2 },
        distance: 10,
        points: 100,
        win: false,
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.BAD_REQUEST },
    });
    expect(connectionRegistryService.getConnection).not.toHaveBeenCalled();
    expect(sessionService.handleGuess).not.toHaveBeenCalled();
  });
});
