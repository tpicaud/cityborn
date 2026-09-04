import { AsyncResource } from 'node:async_hooks';
import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import {
  createHttpWideEvent,
  deriveHttpDomain,
  deriveWideEventOutcome,
  emitWideEventLine,
  resolveHttpRoute,
  WIDE_EVENT_LOGGER,
  type WideEventLogger,
} from '../wide-event/wide-event';
import {
  type WideEventClsStore,
  WideEventService,
} from '../wide-event/wide-event.service';

@Injectable()
export class HttpWideEventMiddleware implements NestMiddleware {
  constructor(
    private readonly wideEventService: WideEventService,
    private readonly cls: ClsService<WideEventClsStore>,
    @Inject(WIDE_EVENT_LOGGER) private readonly logger: WideEventLogger,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    this.cls.run(() => {
      this.wideEventService.set(createHttpWideEvent(request));
      const start = process.hrtime.bigint();
      let emitted = false;

      const emit = (aborted: boolean): void => {
        if (emitted) {
          return;
        }
        emitted = true;

        const statusCode = response.statusCode;
        const route = resolveHttpRoute(request, statusCode);
        const wideEvent = this.wideEventService.finalize({
          domain: deriveHttpDomain(route),
          operation: `${request.method} ${route}`,
          route,
          statusCode,
          outcome: deriveWideEventOutcome(statusCode, aborted),
          durationMs: Number(process.hrtime.bigint() - start) / 1e6,
        });
        if (wideEvent) {
          emitWideEventLine(this.logger, wideEvent);
        }
      };

      response.once(
        'finish',
        AsyncResource.bind(() => emit(false)),
      );
      response.once(
        'close',
        AsyncResource.bind(() => emit(!response.writableFinished)),
      );
      next();
    });
  }
}
