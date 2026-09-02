import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { WsArgumentsHost } from '@nestjs/common/interfaces';
import { ClsService } from 'nestjs-cls';
import { PinoLogger } from 'nestjs-pino';
import { finalize, Observable } from 'rxjs';
import { resolveClientIpFromHeaders } from '../../rate-limit/resolve-client-ip';
import type { SessionSocket } from '../types/session-socket';
import { createWsWideEvent, emitWideEventLine } from '../wide-event/wide-event';
import {
  type WideEventClsStore,
  WideEventService,
} from '../wide-event/wide-event.service';

@Injectable()
export class WsWideEventInterceptor implements NestInterceptor {
  constructor(
    private readonly wideEventService: WideEventService,
    private readonly cls: ClsService<WideEventClsStore>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('WideEvent');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'ws') {
      return next.handle();
    }

    const ws = context.switchToWs();

    return new Observable((subscriber) => {
      this.cls.run(() => {
        this.initWideEvent(ws);
        const start = process.hrtime.bigint();

        let emitted = false;
        const emit = (): void => {
          if (emitted) {
            return;
          }
          emitted = true;

          const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
          this.wideEventService.enrich({ durationMs });
          const wideEvent = this.wideEventService.get();
          if (wideEvent) {
            emitWideEventLine(this.logger, wideEvent);
          }
        };

        const subscription = next
          .handle()
          .pipe(finalize(emit))
          .subscribe(subscriber);
        subscriber.add(subscription);
      });
    });
  }

  private initWideEvent(ws: WsArgumentsHost): void {
    const client = ws.getClient<SessionSocket>();
    const rawVisitorId = client.data.visitorId;

    this.wideEventService.set(
      createWsWideEvent({
        eventName: ws.getPattern(),
        socketId: client.id,
        ip: resolveClientIpFromHeaders(
          client.handshake.headers,
          client.handshake.address,
        ),
        userAgent: client.handshake.headers['user-agent'],
        visitorId: Array.isArray(rawVisitorId) ? rawVisitorId[0] : rawVisitorId,
      }),
    );

    const user = client.data.user;
    this.wideEventService.enrich({
      isAuthenticated: Boolean(user),
      ...(user ? { userId: user.id } : {}),
    });
  }
}
