import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { catchError, type Observable, tap, throwError } from 'rxjs';
import { exceptionToApiError } from '../filters/default-exception.filter';
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

    const emit = (statusCode: number): void => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const route = request.route?.path;
      this.wideEventService.enrich({
        statusCode,
        durationMs,
        ...(route ? { route } : {}),
      });
      const level = deriveWideEventLevel(statusCode);
      this.logger[level](
        { ...this.wideEventService.get(), event: 'http_request' },
        'request',
      );
    };

    return next.handle().pipe(
      tap(() => emit(response.statusCode)),
      catchError((error: unknown) => {
        emit(exceptionToApiError(error).statusCode);
        return throwError(() => error);
      }),
    );
  }
}
