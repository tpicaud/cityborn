import type { WsAck } from '@cityborn/api';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

@Injectable()
export class WsAckInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<object | undefined>,
  ): Observable<WsAck> {
    return next.handle().pipe(map((data) => ({ ...data, success: true })));
  }
}
