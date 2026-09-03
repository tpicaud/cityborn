import { AsyncResource } from 'node:async_hooks';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import {
  createHttpWideEvent,
  deriveWideEventOutcome,
  resolveHttpWideEventContext,
} from './wide-event';
import { type WideEventClsStore, WideEventService } from './wide-event.service';

@Injectable()
export class HttpWideEventMiddleware implements NestMiddleware {
  constructor(
    private readonly wideEventService: WideEventService,
    private readonly cls: ClsService<WideEventClsStore>,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    this.cls.run(() => {
      this.wideEventService.set(createHttpWideEvent(request));
      this.registerCompletion(request, response);
      next();
    });
  }

  private registerCompletion(request: Request, response: Response): void {
    const complete = (aborted: boolean): void => {
      const resolvedRoute = request.route?.path;
      const route =
        typeof resolvedRoute === 'string' && resolvedRoute !== '/{*path}'
          ? resolvedRoute
          : '<unmatched>';
      if (route === '<unmatched>') {
        this.wideEventService.enrich({
          errorMessage: 'Route introuvable',
          errorStack: undefined,
        });
      }
      this.wideEventService.enrich(
        resolveHttpWideEventContext(request.method, route),
      );
      this.wideEventService.complete({
        route,
        outcome: aborted
          ? 'aborted'
          : deriveWideEventOutcome(response.statusCode),
        ...(aborted ? {} : { statusCode: response.statusCode }),
      });
    };

    const completeResponse = AsyncResource.bind(() => complete(false));
    const completeAbortedResponse = AsyncResource.bind(() => complete(true));

    response.once('finish', completeResponse);
    response.once('close', () => {
      if (!response.writableFinished) {
        completeAbortedResponse();
      }
    });
    request.once('aborted', completeAbortedResponse);
  }
}
