import { API_VERSION_HEADER_NAME, parseClientApiVersion } from '@cityborn/api';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AppSocket } from '../types/app-socket';

export const ClientApiVersion = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number | undefined =>
    parseClientApiVersion(
      context.getType() === 'ws'
        ? context.switchToWs().getClient<AppSocket>().handshake.auth.apiVersion
        : context.switchToHttp().getRequest<Request>().headers[
            API_VERSION_HEADER_NAME.toLowerCase()
          ],
    ),
);
