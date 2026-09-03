import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import {
  exceptionToApiError,
  toWideEventErrorFields,
} from '../common/errors/exception-to-api-error';
import type { SessionSocket } from '../common/types/session-socket';
import {
  createWsWideEvent,
  deriveWideEventOutcome,
  firstHeaderValue,
} from '../common/wide-event/wide-event';
import {
  type WideEventClsStore,
  WideEventService,
} from '../common/wide-event/wide-event.service';
import { ConnectionRegistryService } from '../connection-registry/connection-registry.service';
import { RateLimitService } from './rate-limit.service';
import { resolveClientIpFromHeaders } from './resolve-client-ip';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly connectionRegistryService: ConnectionRegistryService,
    private readonly wideEventService: WideEventService,
    private readonly cls: ClsService<WideEventClsStore>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextType = context.getType<'http' | 'ws'>();

    if (contextType === 'ws') {
      this.initWsWideEvent(context);
      try {
        await this.consumeWsMessage(context);
      } catch (exception) {
        const payload = exceptionToApiError(exception);
        this.wideEventService.enrich(
          toWideEventErrorFields(payload, exception),
        );
        this.wideEventService.complete({
          statusCode: payload.statusCode,
          outcome: deriveWideEventOutcome(payload.statusCode),
        });
        throw exception;
      }
    } else {
      await this.consumeHttp(context);
    }

    return true;
  }

  private async consumeHttp(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `${request.ip}:${request.method}:${request.route?.path ?? request.url}`;

    this.wideEventService.enrich({ rateLimitBucket: 'rl:http' });
    const result = await this.rateLimitService.consumeHttp(key);
    this.wideEventService.enrich({
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

    this.wideEventService.enrich({ rateLimitBucket: 'rl:ws:msg' });
    const result = await this.rateLimitService.consumeWsMessage(key);
    this.wideEventService.enrich({
      rateLimitRemaining: result?.remainingPoints,
    });
  }

  private initWsWideEvent(context: ExecutionContext): void {
    this.cls.enter();
    const ws = context.switchToWs();
    const client = ws.getClient<SessionSocket>();
    const headers = client.handshake.headers;
    const rawVisitorId = client.data.visitorId;

    this.wideEventService.set(
      createWsWideEvent({
        eventName: ws.getPattern(),
        socketId: client.id,
        ip: resolveClientIpFromHeaders(headers, client.handshake.address),
        userAgent: headers['user-agent'],
        visitorId: Array.isArray(rawVisitorId) ? rawVisitorId[0] : rawVisitorId,
        client: firstHeaderValue(headers['x-client-name']),
        clientVersion: firstHeaderValue(headers['x-client-version']),
      }),
    );
    const user = client.data.user;
    this.wideEventService.enrich({
      isAuthenticated: Boolean(user),
      ...(user ? { userId: user.id } : {}),
    });
  }
}
