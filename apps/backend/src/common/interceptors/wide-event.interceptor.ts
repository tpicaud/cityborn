import { AsyncResource } from 'node:async_hooks';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import type { Observable } from 'rxjs';
import { deriveWideEventLevel } from '../wide-event/wide-event';
import { WideEventService } from '../wide-event/wide-event.service';

@Injectable()
export class WideEventInterceptor implements NestInterceptor {
  constructor(
    private readonly wideEventService: WideEventService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('WideEvent');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = process.hrtime.bigint();

    let emitted = false;
    const emit = (): void => {
      if (emitted) {
        return;
      }
      emitted = true;

      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const route = request.route?.path;
      this.wideEventService.enrich({
        statusCode: response.statusCode,
        durationMs,
        ...(route ? { route } : {}),
      });
      const level = deriveWideEventLevel(response.statusCode);
      this.logger[level](
        { ...this.wideEventService.get(), event: 'http_request' },
        'request',
      );
    };

    const boundEmit = AsyncResource.bind(emit);
    response.on('finish', boundEmit);
    response.on('close', boundEmit);

    return next.handle();
  }
}
