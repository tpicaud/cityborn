import type { User } from '@cityborn/api';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const type = ctx.getType<'http' | 'ws'>();

    if (type === 'http') {
      const request = ctx.switchToHttp().getRequest<Request>();
      return request.user;
    }

    if (type === 'ws') {
      const client = ctx.switchToWs().getClient();

      return client.user as User | undefined;
    }

    return undefined;
  },
);
