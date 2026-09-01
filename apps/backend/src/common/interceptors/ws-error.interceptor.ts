import type { ApiError } from '@cityborn/api';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { catchError, type Observable, of } from 'rxjs';
import { exceptionToApiError } from '../errors/exception-to-api-error';
import { logApiError } from '../filters/utils';

@Injectable()
export class WsErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WsErrorInterceptor.name);

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError((exception: unknown) => {
        const payload: ApiError = exceptionToApiError(exception);
        logApiError(this.logger, 'WS Error', payload, exception);

        return of({ success: false, error: payload } satisfies {
          success: false;
          error: ApiError;
        });
      }),
    );
  }
}
