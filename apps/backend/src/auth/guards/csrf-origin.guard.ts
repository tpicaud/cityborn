import { contract, ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TsRestAppRouteMetadataKey } from '@ts-rest/nest';
import type { Request } from 'express';
import { HTTP_CONFIG, type HttpConfig } from '../../config/config.module';
import { AuthCookieService } from '../services/auth-cookie.service';

const safeMethods: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

type RouteSignatureInput = {
  method: string;
  path: string;
};

function routeSignature(route: RouteSignatureInput): string {
  return `${route.method} ${route.path}`;
}

const cookieAuthRouteSignatures: ReadonlySet<string> = new Set(
  Object.values(contract.auth.cookie).map(routeSignature),
);

function readResolvedRoute(
  tsRestRouteMetadata: unknown,
): RouteSignatureInput | undefined {
  if (
    typeof tsRestRouteMetadata !== 'object' ||
    tsRestRouteMetadata === null ||
    !('appRoute' in tsRestRouteMetadata)
  ) {
    return undefined;
  }
  const { appRoute } = tsRestRouteMetadata;
  if (
    typeof appRoute !== 'object' ||
    appRoute === null ||
    !('method' in appRoute) ||
    !('path' in appRoute) ||
    typeof appRoute.method !== 'string' ||
    typeof appRoute.path !== 'string'
  ) {
    return undefined;
  }
  return { method: appRoute.method, path: appRoute.path };
}

@Injectable()
export class CsrfOriginGuard implements CanActivate {
  constructor(
    @Inject(HTTP_CONFIG) private readonly httpConfig: HttpConfig,
    private readonly reflector: Reflector,
    private readonly authCookieService: AuthCookieService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest<Request>();
    if (safeMethods.has(request.method)) {
      return true;
    }

    const origin: string | undefined = request.headers.origin;
    if (origin !== undefined && this.httpConfig.corsOrigins.includes(origin)) {
      return true;
    }
    if (origin === undefined && !this.usesCookieTransport(context, request)) {
      return true;
    }

    throw new ForbiddenException({
      code: ErrorCode.CSRF_ORIGIN_FORBIDDEN,
      message: 'Request origin is not allowed',
    });
  }

  private usesCookieTransport(
    context: ExecutionContext,
    request: Request,
  ): boolean {
    return (
      this.isCookieAuthRoute(context) ||
      this.authCookieService.hasAuthenticationCookie(request.headers.cookie)
    );
  }

  private isCookieAuthRoute(context: ExecutionContext): boolean {
    const tsRestRouteMetadata: unknown = this.reflector.get<unknown>(
      TsRestAppRouteMetadataKey,
      context.getHandler(),
    );
    const resolvedRoute: RouteSignatureInput | undefined =
      readResolvedRoute(tsRestRouteMetadata);
    return (
      resolvedRoute !== undefined &&
      cookieAuthRouteSignatures.has(routeSignature(resolvedRoute))
    );
  }
}
