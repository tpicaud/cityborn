import {
  buildUser,
  ErrorCode,
  type User,
  type WsServerToClientEvents,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { RemoteSocket } from 'socket.io';
import type {
  AppServer,
  AppSocket,
  AppSocketData,
} from '../common/types/app-socket';
import { AuthenticatedSocketService } from './authenticated-socket.service';

type AppBroadcastOperator = ReturnType<AppServer['in']>;
type AppRemoteSocket = RemoteSocket<WsServerToClientEvents, AppSocketData>;

function buildRemoteSocket(
  authentication: AppSocketData['authentication'],
): DeepMocked<AppRemoteSocket> {
  return createMock<AppRemoteSocket>({
    data: { authentication, visitorId: undefined },
  });
}

function buildAuthenticatedSocketService() {
  const server: DeepMocked<AppServer> = createMock<AppServer>();
  const room: DeepMocked<AppBroadcastOperator> =
    createMock<AppBroadcastOperator>();
  server.in.mockReturnValue(room);
  const authenticatedSocketService: AuthenticatedSocketService =
    new AuthenticatedSocketService();
  authenticatedSocketService.registerServer(server);

  return { server, room, authenticatedSocketService };
}

describe('AuthenticatedSocketService', () => {
  describe('joinUserRoom', () => {
    it('joins the private authentication room', async () => {
      const user: User = buildUser();
      const socket: DeepMocked<AppSocket> = createMock<AppSocket>();
      const authenticatedSocketService: AuthenticatedSocketService =
        new AuthenticatedSocketService();

      await authenticatedSocketService.joinUserRoom(socket, user.id);

      expect(socket.join).toHaveBeenCalledWith(`auth:user:${user.id}`);
    });
  });

  describe('disconnectOlderSessions', () => {
    it('disconnects only older authenticated and pending sockets', async () => {
      const user: User = buildUser();
      const oldSocket: DeepMocked<AppRemoteSocket> = buildRemoteSocket({
        status: 'authenticated',
        user,
        sessionVersion: 1,
      });
      const pendingSocket: DeepMocked<AppRemoteSocket> = buildRemoteSocket({
        status: 'pending',
        userId: user.id,
        sessionVersion: 1,
      });
      const currentSocket: DeepMocked<AppRemoteSocket> = buildRemoteSocket({
        status: 'authenticated',
        user,
        sessionVersion: 2,
      });
      const guestSocket: DeepMocked<AppRemoteSocket> = buildRemoteSocket({
        status: 'anonymous',
      });
      const {
        server,
        room,
        authenticatedSocketService,
      }: ReturnType<typeof buildAuthenticatedSocketService> =
        buildAuthenticatedSocketService();
      room.fetchSockets.mockResolvedValue([
        oldSocket,
        pendingSocket,
        currentSocket,
        guestSocket,
      ]);

      await authenticatedSocketService.disconnectOlderSessions(user.id, 2);

      expect(server.in).toHaveBeenCalledWith(`auth:user:${user.id}`);
      expect(oldSocket.disconnect).toHaveBeenCalledWith(true);
      expect(pendingSocket.disconnect).toHaveBeenCalledWith(true);
      expect(currentSocket.disconnect).not.toHaveBeenCalled();
      expect(guestSocket.disconnect).not.toHaveBeenCalled();
    });

    it('fails explicitly when the Socket.IO server is not initialized', async () => {
      const user: User = buildUser();
      const authenticatedSocketService: AuthenticatedSocketService =
        new AuthenticatedSocketService();

      await expect(
        authenticatedSocketService.disconnectOlderSessions(user.id, 1),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.UNKNOWN_ERROR },
      });
    });
  });
});
