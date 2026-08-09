import {
  type ContextType,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';

export const VisitorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const ctxType: ContextType = ctx.getType();
    let visitorId: string | null = null;

    if (ctxType === 'http') {
      const request = ctx.switchToHttp().getRequest();
      visitorId = request.visitorId;
    } else if (ctxType === 'ws') {
      const client = ctx.switchToWs().getClient();
      visitorId = client.visitorId;
    }

    return visitorId;
  },
);
