import { ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  mixin,
  type Type,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthSession } from '../../common/types/auth-session';
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { HTTP_CONFIG, type HttpConfig } from '../../config/config.module';
import type { AuthRequest } from '../auth-request';
import { AuthCookieService } from '../services/auth-cookie.service';
import {
  type AuthTokenPayload,
  AuthTokenService,
} from '../services/auth-token.service';
import { extractBearerToken } from './bearer-token';

type AccessTokenGuardPolicy = {
  acceptsCookie: boolean;
  requiredAccess: 'none' | 'user' | 'admin';
};

type AccessTokenTransport = 'bearer' | 'cookie';

type AccessTokenSource = {
  accessToken: string;
  transport: AccessTokenTransport;
};

type AdminAccessRequest = {
  authSession: AuthSession;
  transport: AccessTokenTransport;
  origin: string | undefined;
};

type UnauthenticatedReason = {
  code: ErrorCode;
  message: string;
};

function createAccessTokenGuard(
  policy: AccessTokenGuardPolicy,
): Type<CanActivate> {
  @Injectable()
  class AccessTokenGuard implements CanActivate {
    constructor(
      private readonly authTokenService: AuthTokenService,
      private readonly authCookieService: AuthCookieService,
      private readonly wideEventService: WideEventService,
      @Inject(HTTP_CONFIG) private readonly httpConfig: HttpConfig,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request: AuthRequest = context
        .switchToHttp()
        .getRequest<AuthRequest>();
      const accessTokenSource: AccessTokenSource | undefined =
        this.readAccessToken(request);
      if (!accessTokenSource) {
        return this.continueUnauthenticated({
          code: ErrorCode.USER_TOKEN_MISSING,
          message: 'Token missing',
        });
      }

      const payload: AuthTokenPayload =
        await this.authTokenService.verifyAccessToken(
          accessTokenSource.accessToken,
        );
      const authSession: AuthSession | null =
        await this.authTokenService.resolveAuthSession(payload);
      if (!authSession) {
        return this.continueUnauthenticated({
          code: ErrorCode.USER_NOT_FOUND,
          message: 'User not found',
        });
      }

      request.authSession = authSession;
      this.wideEventService.enrichAuth({
        userId: authSession.user.id,
        isAuthenticated: true,
      });
      if (policy.requiredAccess === 'admin') {
        this.assertAdminAccess({
          authSession,
          transport: accessTokenSource.transport,
          origin: request.headers.origin,
        });
      }
      return true;
    }

    private assertAdminAccess({
      authSession,
      transport,
      origin,
    }: AdminAccessRequest): void {
      if (
        transport === 'cookie' &&
        origin !== this.httpConfig.backOfficeOrigin
      ) {
        throw new ForbiddenException({
          code: ErrorCode.CSRF_ORIGIN_FORBIDDEN,
          message: 'Admin cookie sessions are restricted to the back-office',
        });
      }
      if (authSession.user.role !== 'admin') {
        throw new ForbiddenException({
          code: ErrorCode.USER_NOT_ADMIN,
          message: 'Admin role required',
        });
      }
    }

    private readAccessToken(
      request: AuthRequest,
    ): AccessTokenSource | undefined {
      const bearerToken: string | undefined = extractBearerToken(
        request.headers,
      );
      if (bearerToken !== undefined) {
        return { accessToken: bearerToken, transport: 'bearer' };
      }
      if (!policy.acceptsCookie) {
        return undefined;
      }
      const cookieToken: string | undefined =
        this.authCookieService.readAccessToken(request.headers.cookie);
      return cookieToken === undefined
        ? undefined
        : { accessToken: cookieToken, transport: 'cookie' };
    }

    private continueUnauthenticated(reason: UnauthenticatedReason): true {
      if (policy.requiredAccess !== 'none') {
        throw new UnauthorizedException(reason);
      }
      this.wideEventService.enrichAuth({ isAuthenticated: false });
      return true;
    }
  }

  return mixin(AccessTokenGuard);
}

export const AuthGuard: Type<CanActivate> = createAccessTokenGuard({
  acceptsCookie: true,
  requiredAccess: 'user',
});

export const BearerAuthGuard: Type<CanActivate> = createAccessTokenGuard({
  acceptsCookie: false,
  requiredAccess: 'user',
});

export const AdminGuard: Type<CanActivate> = createAccessTokenGuard({
  acceptsCookie: true,
  requiredAccess: 'admin',
});

export const OptionalAuthGuard: Type<CanActivate> = createAccessTokenGuard({
  acceptsCookie: true,
  requiredAccess: 'none',
});
