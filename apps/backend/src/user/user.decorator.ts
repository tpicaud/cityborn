import type { User } from '@cityborn/api';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SessionSocket } from '../common/types/session-socket';

export const CurrentAuthVersion = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    if (ctx.getType<'http' | 'ws'>() !== 'http') return undefined;

    const request = ctx.switchToHttp().getRequest<Request>();
    return request.authVersion;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const type = ctx.getType<'http' | 'ws'>();

    if (type === 'http') {
      const request = ctx.switchToHttp().getRequest<Request>();
      return request.user;
    }

    if (type === 'ws') {
      const client = ctx.switchToWs().getClient<SessionSocket>();
      return client.data.user ?? undefined;
    }

    return undefined;
  },
);
