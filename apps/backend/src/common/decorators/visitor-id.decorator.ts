import {
  type ContextType,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { SessionSocket } from '../types/session-socket';

export const VisitorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const ctxType: ContextType = ctx.getType();

    if (ctxType === 'ws') {
      return ctx.switchToWs().getClient<SessionSocket>().data.visitorId;
    }

    if (ctxType === 'http') {
      return ctx.switchToHttp().getRequest().visitorId;
    }

    return undefined;
  },
);
