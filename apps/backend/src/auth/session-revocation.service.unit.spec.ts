import {
  buildUser,
  ErrorCode,
  type User,
  type WsServerToClientEvents,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { RemoteSocket } from 'socket.io';
import type { AppServer, AppSocketData } from '../common/types/app-socket';
import type { UserService } from '../user/user.service';
import {
  SessionRevocationService,
  userAuthenticationRoom,
} from './session-revocation.service';

type AppBroadcastOperator = ReturnType<AppServer['in']>;
type AppRemoteSocket = RemoteSocket<WsServerToClientEvents, AppSocketData>;

function buildSocket(
  authentication: AppSocketData['authentication'],
): DeepMocked<AppRemoteSocket> {
  return createMock<AppRemoteSocket>({
    data: { authentication, visitorId: undefined },
  });
}

function buildSessionRevocationService() {
  const userService: DeepMocked<UserService> = createMock<UserService>();
  const server: DeepMocked<AppServer> = createMock<AppServer>();
  const room: DeepMocked<AppBroadcastOperator> =
    createMock<AppBroadcastOperator>();
  server.in.mockReturnValue(room);
  const sessionRevocationService: SessionRevocationService =
    new SessionRevocationService(userService);
  sessionRevocationService.registerServer(server);

  return { userService, server, room, sessionRevocationService };
}

describe('SessionRevocationService', () => {
  describe('rotateSessionVersion', () => {
    it('persists the version before disconnecting only older authenticated sockets', async () => {
      const user: User = buildUser();
      const oldSocket: DeepMocked<AppRemoteSocket> = buildSocket({
        status: 'authenticated',
        user,
        sessionVersion: 1,
      });
      const pendingSocket: DeepMocked<AppRemoteSocket> = buildSocket({
        status: 'pending',
        userId: user.id,
        sessionVersion: 1,
      });
      const currentSocket: DeepMocked<AppRemoteSocket> = buildSocket({
        status: 'authenticated',
        user,
        sessionVersion: 2,
      });
      const guestSocket: DeepMocked<AppRemoteSocket> = buildSocket({
        status: 'anonymous',
      });
      const {
        userService,
        server,
        room,
        sessionRevocationService,
      }: ReturnType<typeof buildSessionRevocationService> =
        buildSessionRevocationService();
      userService.incrementSessionVersion.mockResolvedValue(2);
      room.fetchSockets.mockResolvedValue([
        oldSocket,
        pendingSocket,
        currentSocket,
        guestSocket,
      ]);

      await expect(
        sessionRevocationService.rotateSessionVersion(user.id),
      ).resolves.toBe(2);

      expect(server.in).toHaveBeenCalledWith(userAuthenticationRoom(user.id));
      expect(oldSocket.disconnect).toHaveBeenCalledWith(true);
      expect(pendingSocket.disconnect).toHaveBeenCalledWith(true);
      expect(currentSocket.disconnect).not.toHaveBeenCalled();
      expect(guestSocket.disconnect).not.toHaveBeenCalled();
      expect(
        userService.incrementSessionVersion.mock.invocationCallOrder[0],
      ).toBeLessThan(room.fetchSockets.mock.invocationCallOrder[0] ?? 0);
    });
  });

  describe('rotateSessionVersion', () => {
    it('fails explicitly before persisting when the Socket.IO server is not initialized', async () => {
      const user: User = buildUser();
      const userService: DeepMocked<UserService> = createMock<UserService>();
      const sessionRevocationService: SessionRevocationService =
        new SessionRevocationService(userService);

      await expect(
        sessionRevocationService.rotateSessionVersion(user.id),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.UNKNOWN_ERROR },
      });
      expect(userService.incrementSessionVersion).not.toHaveBeenCalled();
    });
  });
});
