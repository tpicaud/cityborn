import {
  type ContextType,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { AppSocket } from '../types/app-socket';

export const VisitorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const ctxType: ContextType = ctx.getType();

    if (ctxType === 'ws') {
      return ctx.switchToWs().getClient<AppSocket>().data.visitorId;
    }

    if (ctxType === 'http') {
      return ctx.switchToHttp().getRequest().visitorId;
    }

    return undefined;
  },
);
