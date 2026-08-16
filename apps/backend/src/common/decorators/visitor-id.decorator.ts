import {
  type ContextType,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { SessionSocket } from '../types/session-socket';

export const VisitorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const ctxType: ContextType = ctx.getType();
    let visitorId: string | null = null;

    if (ctxType === 'http') {
      const request = ctx.switchToHttp().getRequest();
      visitorId = request.visitorId;
    } else if (ctxType === 'ws') {
      const client = ctx.switchToWs().getClient<SessionSocket>();
      visitorId = Array.isArray(client.data.visitorId)
        ? (client.data.visitorId[0] ?? null)
        : (client.data.visitorId ?? null);
    }

    return visitorId;
  },
);
