import { AsyncResource } from 'node:async_hooks';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { WsArgumentsHost } from '@nestjs/common/interfaces';
import { ClsService } from 'nestjs-cls';
import { finalize, Observable, tap } from 'rxjs';
import { resolveClientIpFromHeaders } from '../../rate-limit/resolve-client-ip';
import {
  exceptionToApiError,
  toWideEventErrorFields,
} from '../errors/exception-to-api-error';
import type { SessionSocket } from '../types/session-socket';
import {
  createWsWideEvent,
  deriveWideEventOutcome,
  firstHeaderValue,
} from '../wide-event/wide-event';
import {
  type WideEventClsStore,
  WideEventService,
} from '../wide-event/wide-event.service';

@Injectable()
export class WsWideEventInterceptor implements NestInterceptor {
  constructor(
    private readonly wideEventService: WideEventService,
    private readonly cls: ClsService<WideEventClsStore>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'ws') {
      return next.handle();
    }

    const ws = context.switchToWs();
    if (this.wideEventService.get()?.transport === 'ws') {
      return this.completeOnFinalize(next.handle());
    }

    return new Observable((subscriber) => {
      this.cls.run(() => {
        this.initWideEvent(ws);
        const subscription = next.handle();
        const observedSubscription =
          this.completeOnFinalize(subscription).subscribe(subscriber);
        subscriber.add(observedSubscription);
      });
    });
  }

  private completeOnFinalize(source: Observable<unknown>): Observable<unknown> {
    let settled = false;
    let failed = false;
    let failure: unknown;
    const complete = AsyncResource.bind(() =>
      this.completeWideEvent(!settled, failed, failure),
    );
    return source.pipe(
      tap({
        complete: () => {
          settled = true;
        },
        error: (exception: unknown) => {
          settled = true;
          failed = true;
          failure = exception;
        },
      }),
      finalize(complete),
    );
  }

  private completeWideEvent(
    aborted: boolean,
    failed = false,
    failure?: unknown,
  ): void {
    if (aborted) {
      this.wideEventService.complete({ outcome: 'aborted' });
      return;
    }

    if (failed && this.wideEventService.get()?.statusCode === undefined) {
      const payload = exceptionToApiError(failure);
      this.wideEventService.enrich({
        statusCode: payload.statusCode,
        ...toWideEventErrorFields(payload, failure),
      });
    }

    const statusCode = this.wideEventService.get()?.statusCode ?? 200;
    this.wideEventService.complete({
      statusCode,
      outcome: deriveWideEventOutcome(statusCode),
    });
  }

  private initWideEvent(ws: WsArgumentsHost): void {
    const client = ws.getClient<SessionSocket>();
    const rawVisitorId = client.data.visitorId;
    const headers = client.handshake.headers;

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
