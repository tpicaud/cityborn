import type { User } from '@cityborn/api';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AppRequest } from '../common/types/app-request';
import type { AppSocket } from '../common/types/app-socket';
import type { AuthSession } from '../common/types/auth-session';

function resolveCurrentAuthSession(
  ctx: ExecutionContext,
): AuthSession | undefined {
  const contextType: 'http' | 'ws' = ctx.getType<'http' | 'ws'>();

  if (contextType === 'http') {
    const request: AppRequest = ctx.switchToHttp().getRequest<AppRequest>();
    return request.authSession;
  }

  if (contextType === 'ws') {
    const client: AppSocket = ctx.switchToWs().getClient<AppSocket>();
    return client.data.authSession ?? undefined;
  }

  return undefined;
}

export const CurrentAuthSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthSession | undefined =>
    resolveCurrentAuthSession(ctx),
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    return resolveCurrentAuthSession(ctx)?.user;
  },
);
