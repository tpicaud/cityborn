import { AsyncResource } from 'node:async_hooks';
import type { WsLifecycleEventName } from '@cityborn/api';
import { Injectable } from '@nestjs/common';
import { defer, finalize, Observable, tap } from 'rxjs';
import { resolveClientIpFromHeaders } from '../../rate-limit/resolve-client-ip';
import type { SessionSocket } from '../types/session-socket';
import {
  createWsWideEvent,
  firstHeaderValue,
  type WsWideEventInit,
  type WsWideEventKind,
} from './wide-event';
import { WideEventService } from './wide-event.service';

@Injectable()
export class WsWideEventLifecycle {
  constructor(private readonly wideEventService: WideEventService) {}

  run(
    client: SessionSocket,
    eventName: string,
    handler: () => Observable<unknown>,
  ): Observable<unknown> {
    return new Observable((subscriber) => {
      const init: WsWideEventInit = this.createSocketWideEvent(
        client,
        'message',
        eventName,
      );
      return this.wideEventService.run(init, () => {
        this.enrichSocketAuth(client);
        let completed = false;
        return defer(handler)
          .pipe(
            tap({
              complete: () => {
                completed = true;
              },
            }),
            finalize(
              AsyncResource.bind(() =>
                this.wideEventService.finish({ aborted: !completed }),
              ),
            ),
          )
          .subscribe(subscriber);
      });
    });
  }

  runConnectionLifecycle<Result>(
    client: SessionSocket,
    kind: 'connection' | 'disconnection',
    eventName: WsLifecycleEventName,
    handler: () => Promise<Result>,
  ): Promise<Result> {
    return this.wideEventService.run(
      this.createSocketWideEvent(client, kind, eventName),
      async () => {
        try {
          return await handler();
        } finally {
          this.enrichSocketAuth(client);
          this.wideEventService.finish();
        }
      },
    );
  }

  private createSocketWideEvent(
    client: SessionSocket,
    kind: WsWideEventKind,
    eventName: string,
  ): WsWideEventInit {
    const headers = client.handshake.headers;
    return createWsWideEvent({
      kind,
      eventName,
      socketId: client.id,
      ip: resolveClientIpFromHeaders(headers, client.handshake.address),
      userAgent: headers['user-agent'],
      visitorId: client.data.visitorId,
      client: firstHeaderValue(headers['x-client-name']),
      clientVersion: firstHeaderValue(headers['x-client-version']),
    });
  }

  private enrichSocketAuth(client: SessionSocket): void {
    const user = client.data.user;
    this.wideEventService.enrichAuth(
      user
        ? { isAuthenticated: true, userId: user.id }
        : { isAuthenticated: false },
    );
  }
}
