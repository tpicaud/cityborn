import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AppSocket } from '../common/types/app-socket';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { RateLimitService } from './rate-limit.service';
import { resolveClientIpFromHeaders } from './resolve-client-ip';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
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

    this.wideEventService.enrichRateLimit({
      rateLimitBucket: 'rl:http',
      rateLimitStatus: 'pending',
    });
    const result = await this.rateLimitService.consumeHttp(key);
    this.wideEventService.enrichRateLimit({
      rateLimitBucket: 'rl:http',
      rateLimitStatus: 'allowed',
      rateLimitRemaining: result.remainingPoints,
    });
  }

  private async consumeWsMessage(context: ExecutionContext): Promise<void> {
    const client = context.switchToWs().getClient<AppSocket>();
    const key =
      client.data.player?.playerID ??
      resolveClientIpFromHeaders(
        client.handshake.headers,
        client.handshake.address,
      );

    this.wideEventService.enrichRateLimit({
      rateLimitBucket: 'rl:ws:msg',
      rateLimitStatus: 'pending',
    });
    const result = await this.rateLimitService.consumeWsMessage(key);
    this.wideEventService.enrichRateLimit({
      rateLimitBucket: 'rl:ws:msg',
      rateLimitStatus: 'allowed',
      rateLimitRemaining: result.remainingPoints,
    });
  }
}
