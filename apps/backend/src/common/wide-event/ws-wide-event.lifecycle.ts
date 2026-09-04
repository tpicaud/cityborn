import { AsyncResource } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { defer, finalize, Observable, tap } from 'rxjs';
import { resolveClientIpFromHeaders } from '../../rate-limit/resolve-client-ip';
import type { SessionSocket } from '../types/session-socket';
import { createWsWideEvent, firstHeaderValue } from './wide-event';
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
      const headers = client.handshake.headers;
      const init = createWsWideEvent({
        kind: 'message',
        eventName,
        socketId: client.id,
        ip: resolveClientIpFromHeaders(headers, client.handshake.address),
        userAgent: headers['user-agent'],
        visitorId: firstHeaderValue(client.data.visitorId),
        client: firstHeaderValue(headers['x-client-name']),
        clientVersion: firstHeaderValue(headers['x-client-version']),
      });
      return this.wideEventService.run(init, () => {
        const user = client.data.user;
        this.wideEventService.enrichAuth(
          user
            ? { isAuthenticated: true, userId: user.id }
            : { isAuthenticated: false },
        );
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
}
