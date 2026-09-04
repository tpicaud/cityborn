import { AsyncResource } from 'node:async_hooks';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  createHttpWideEvent,
  resolveHttpRoute,
} from '../wide-event/wide-event';
import { WideEventService } from '../wide-event/wide-event.service';

@Injectable()
export class HttpWideEventMiddleware implements NestMiddleware {
  constructor(private readonly wideEventService: WideEventService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    this.wideEventService.run(createHttpWideEvent(request), () => {
      const finish = AsyncResource.bind(() => {
        response.off('finish', finish);
        response.off('close', finish);
        this.wideEventService.finish({
          route: resolveHttpRoute(request),
          statusCode: response.statusCode,
          aborted: !response.writableFinished,
        });
      });
      response.once('finish', finish);
      response.once('close', finish);
      next();
    });
  }
}
