import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { SessionSocket } from '../common/types/session-socket';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { ConnectionRegistryService } from '../connection-registry/connection-registry.service';
import { RateLimitService } from './rate-limit.service';
import { resolveClientIpFromHeaders } from './resolve-client-ip';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly connectionRegistryService: ConnectionRegistryService,
    private readonly wideEventService: WideEventService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextType = context.getType<'http' | 'ws'>();

    if (contextType === 'ws') {
      await this.consumeWsMessage(context);
    } else {
      await this.consumeHttp(context);
    }

    return true;
  }

  private async consumeHttp(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `${request.ip}:${request.method}:${request.route?.path ?? request.url}`;

    const result = await this.rateLimitService.consumeHttp(key);
    this.wideEventService.enrich({
      rateLimitBucket: 'rl:http',
      rateLimitRemaining: result?.remainingPoints,
    });
  }

  private async consumeWsMessage(context: ExecutionContext): Promise<void> {
    const client = context.switchToWs().getClient<SessionSocket>();
    const connection = await this.connectionRegistryService.getConnection(
      client.id,
    );
    const key =
      connection?.playerID ??
      resolveClientIpFromHeaders(
        client.handshake.headers,
        client.handshake.address,
      );

    await this.rateLimitService.consumeWsMessage(key);
  }
}
