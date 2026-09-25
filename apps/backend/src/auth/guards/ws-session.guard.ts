import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { SessionSocket } from '../../common/types/session-socket';
import { UserService } from '../../user/user.service';
import { resolveFullUser } from './utils';

@Injectable()
export class WsSessionGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: SessionSocket = context
      .switchToWs()
      .getClient<SessionSocket>();
    if (!client.data.user) return true;
    try {
      await resolveFullUser(
        client.data.user.id,
        this.userService,
        client.data.sessionVersion ?? 0,
      );
      return true;
    } catch (error) {
      client.disconnect(true);
      throw error;
    }
  }
}
