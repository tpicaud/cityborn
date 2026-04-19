import {
  type CallHandler,
  type ContextType,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';

@Injectable()
export class VisitorIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx: ContextType = context.getType();
    if (ctx === 'http') {
      const request = context.switchToHttp().getRequest();
      const visitorId = request.headers['x-visitor-id'];

      if (visitorId) {
        request.visitorId = visitorId;
      }
    }

    return next.handle();
  }
}
