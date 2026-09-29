import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';

export const HttpResponse = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Response =>
    ctx.switchToHttp().getResponse<Response>(),
);
