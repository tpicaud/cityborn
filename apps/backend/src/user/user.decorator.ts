import type { User } from '@cityborn/api';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AppRequest } from '../common/types/app-request';
import type { AppSocket } from '../common/types/app-socket';
import type { AuthSession } from '../common/types/auth-session';

function resolveCurrentAuthSession(
  ctx: ExecutionContext,
): AuthSession | undefined {
  const type = ctx.getType<'http' | 'ws'>();

  if (type === 'http') {
    const request = ctx.switchToHttp().getRequest<AppRequest>();
    return request.authSession;
  }

  if (type === 'ws') {
    const client = ctx.switchToWs().getClient<AppSocket>();
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
