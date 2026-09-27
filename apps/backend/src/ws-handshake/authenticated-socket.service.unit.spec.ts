import { buildUser, ErrorCode, type User } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { AppServer, AppSocket } from '../common/types/app-socket';
import { AuthenticatedSocketService } from './authenticated-socket.service';

type AppBroadcastOperator = ReturnType<AppServer['in']>;

function buildAuthenticatedSocketService() {
  const server: DeepMocked<AppServer> = createMock<AppServer>();
  const userSessions: DeepMocked<AppBroadcastOperator> =
    createMock<AppBroadcastOperator>();
  const olderSessions: DeepMocked<AppBroadcastOperator> =
    createMock<AppBroadcastOperator>();
  server.in.mockReturnValue(userSessions);
  userSessions.except.mockReturnValue(olderSessions);
  const authenticatedSocketService: AuthenticatedSocketService =
    new AuthenticatedSocketService();
  authenticatedSocketService.registerServer(server);

  return { server, userSessions, olderSessions, authenticatedSocketService };
}

describe('AuthenticatedSocketService', () => {
  describe('joinSessionRooms', () => {
    it('joins the user room and the room of its session version', async () => {
      const user: User = buildUser();
      const socket: DeepMocked<AppSocket> = createMock<AppSocket>();
      const authenticatedSocketService: AuthenticatedSocketService =
        new AuthenticatedSocketService();

      await authenticatedSocketService.joinSessionRooms(socket, {
        user,
        sessionVersion: 3,
      });

      expect(socket.join).toHaveBeenCalledWith([
        `auth:user:${user.id}`,
        `auth:user:${user.id}:version:3`,
      ]);
    });
  });

  describe('disconnectOlderSessions', () => {
    it('disconnects the user sockets outside the current session version', () => {
      const user: User = buildUser();
      const {
        server,
        userSessions,
        olderSessions,
        authenticatedSocketService,
      }: ReturnType<typeof buildAuthenticatedSocketService> =
        buildAuthenticatedSocketService();

      authenticatedSocketService.disconnectOlderSessions(user.id, 2);

      expect(server.in).toHaveBeenCalledWith(`auth:user:${user.id}`);
      expect(userSessions.except).toHaveBeenCalledWith(
        `auth:user:${user.id}:version:2`,
      );
      expect(olderSessions.disconnectSockets).toHaveBeenCalledWith(true);
    });

    it('fails explicitly when the Socket.IO server is not initialized', () => {
      const user: User = buildUser();
      const authenticatedSocketService: AuthenticatedSocketService =
        new AuthenticatedSocketService();

      expect(() =>
        authenticatedSocketService.disconnectOlderSessions(user.id, 1),
      ).toThrow(
        expect.objectContaining({
          response: expect.objectContaining({ code: ErrorCode.UNKNOWN_ERROR }),
        }),
      );
    });
  });
});
