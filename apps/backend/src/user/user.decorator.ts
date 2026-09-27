import type { User } from '@cityborn/api';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AppSocket } from '../common/types/app-socket';
import type { AuthenticationContext } from '../common/types/authentication';

function resolveAuthenticationContext(
  ctx: ExecutionContext,
): AuthenticationContext | undefined {
  const type = ctx.getType<'http' | 'ws'>();

  if (type === 'http') {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.authentication;
  }

  if (type === 'ws') {
    const client = ctx.switchToWs().getClient<AppSocket>();
    const authentication = client.data.authentication;
    return authentication.status === 'authenticated'
      ? authentication
      : undefined;
  }

  return undefined;
}

export const CurrentAuthentication = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticationContext | undefined =>
    resolveAuthenticationContext(ctx),
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    return resolveAuthenticationContext(ctx)?.user;
  },
);
