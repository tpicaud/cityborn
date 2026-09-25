import { ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { HTTP_CONFIG, type HttpConfig } from '../../config/config.module';
import { hasAuthenticationCookie } from '../utils';

const safeMethods: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CookieCsrfGuard implements CanActivate {
  constructor(@Inject(HTTP_CONFIG) private readonly httpConfig: HttpConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest<Request>();
    if (safeMethods.has(request.method)) {
      return true;
    }
    if (!hasAuthenticationCookie(request)) {
      return true;
    }

    const origin: string | undefined = request.headers.origin;
    if (origin !== undefined && this.httpConfig.corsOrigins.includes(origin)) {
      return true;
    }

    throw new ForbiddenException({
      code: ErrorCode.CSRF_ORIGIN_FORBIDDEN,
      message: 'Request origin is not allowed',
    });
  }
}
