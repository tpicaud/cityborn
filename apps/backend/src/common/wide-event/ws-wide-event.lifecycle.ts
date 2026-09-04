import { AsyncResource } from 'node:async_hooks';
import { Inject, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { finalize, isObservable } from 'rxjs';
import { resolveClientIpFromHeaders } from '../../rate-limit/resolve-client-ip';
import {
  exceptionToApiError,
  toWideEventErrorFields,
} from '../errors/exception-to-api-error';
import type { SessionSocket } from '../types/session-socket';
import {
  createWsWideEvent,
  deriveWideEventOutcome,
  emitWideEventLine,
  firstHeaderValue,
  WIDE_EVENT_LOGGER,
  type WideEventLogger,
} from './wide-event';
import { type WideEventClsStore, WideEventService } from './wide-event.service';

@Injectable()
export class WsWideEventLifecycle {
  constructor(
    private readonly wideEventService: WideEventService,
    private readonly cls: ClsService<WideEventClsStore>,
    @Inject(WIDE_EVENT_LOGGER) private readonly logger: WideEventLogger,
  ) {}

  run(
    client: SessionSocket,
    eventName: string,
    handler: () => Promise<unknown>,
  ): Promise<unknown> {
    return this.cls.run(async () => {
      this.init(client, eventName);
      const start = process.hrtime.bigint();
      let aborted = false;
      let emitted = false;
      const markAborted = (): void => {
        aborted = true;
      };
      client.once('disconnect', markAborted);

      const emit = (): void => {
        if (emitted) {
          return;
        }
        emitted = true;
        client.off('disconnect', markAborted);

        const statusCode = this.wideEventService.get()?.statusCode ?? 200;
        this.wideEventService.enrich({
          statusCode,
          outcome: deriveWideEventOutcome(statusCode, aborted),
          durationMs: Number(process.hrtime.bigint() - start) / 1e6,
        });
        const wideEvent = this.wideEventService.get();
        if (wideEvent) {
          emitWideEventLine(this.logger, wideEvent);
        }
      };
      const boundEmit = AsyncResource.bind(emit);

      try {
        const result = await handler();
        if (isObservable(result)) {
          return result.pipe(finalize(boundEmit));
        }
        boundEmit();
        return result;
      } catch (exception) {
        const payload = exceptionToApiError(exception);
        this.wideEventService.enrich({
          statusCode: payload.statusCode,
          ...toWideEventErrorFields(payload, exception),
        });
        boundEmit();
        throw exception;
      }
    });
  }

  private init(client: SessionSocket, eventName: string): void {
    const headers = client.handshake.headers;
    const rawVisitorId = client.data.visitorId;
    this.wideEventService.set(
      createWsWideEvent({
        eventName,
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
