import type { ApiError } from '@cityborn/api';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { catchError, type Observable, of } from 'rxjs';
import {
  exceptionToApiError,
  toWideEventErrorFields,
} from '../errors/exception-to-api-error';
import { WideEventService } from '../wide-event/wide-event.service';

@Injectable()
export class WsErrorInterceptor implements NestInterceptor {
  constructor(private readonly wideEventService: WideEventService) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError((exception: unknown) => {
        const payload: ApiError = exceptionToApiError(exception);
        this.wideEventService.enrich({
          statusCode: payload.statusCode,
          ...toWideEventErrorFields(payload, exception),
        });

        return of({ success: false, error: payload } satisfies {
          success: false;
          error: ApiError;
        });
      }),
    );
  }
}
