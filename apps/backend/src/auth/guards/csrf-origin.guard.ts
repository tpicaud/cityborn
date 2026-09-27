import { contract, ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { AppRoute } from '@ts-rest/core';
import type { Request } from 'express';
import { HTTP_CONFIG, type HttpConfig } from '../../config/config.module';
import { hasAuthenticationCookie } from '../auth-cookies';

const safeMethods: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

const cookieAuthPaths: ReadonlySet<string> = new Set(
  Object.values(contract.auth.cookie).map(
    (route: AppRoute): string => route.path,
  ),
);

@Injectable()
export class CookieCsrfGuard implements CanActivate {
  constructor(@Inject(HTTP_CONFIG) private readonly httpConfig: HttpConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest<Request>();
    if (safeMethods.has(request.method)) {
      return true;
    }
    if (!this.usesCookieTransport(request)) {
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

  private usesCookieTransport(request: Request): boolean {
    return (
      cookieAuthPaths.has(request.path) ||
      hasAuthenticationCookie(request.headers.cookie)
    );
  }
}
