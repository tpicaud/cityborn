import { buildUser, type User } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { ExecutionContext } from '@nestjs/common';
import type { SessionSocket } from '../../common/types/session-socket';
import type { UserService } from '../../user/user.service';
import { WsSessionGuard } from './ws-session.guard';

describe('WsSessionGuard', () => {
  describe('canActivate', () => {
    it('disconnects a revoked socket before executing a message', async () => {
      const user: User = buildUser();
      const userService: DeepMocked<UserService> = createMock<UserService>();
      const socket: DeepMocked<SessionSocket> = createMock<SessionSocket>({
        data: { user, sessionVersion: 0 },
      });
      const context: DeepMocked<ExecutionContext> =
        createMock<ExecutionContext>();
      context.switchToWs().getClient.mockReturnValue(socket);
      userService.findSessionVersion.mockResolvedValue(1);
      const guard: WsSessionGuard = new WsSessionGuard(userService);

      await expect(guard.canActivate(context)).rejects.toThrow();

      expect(socket.disconnect).toHaveBeenCalledWith(true);
    });
  });
});
