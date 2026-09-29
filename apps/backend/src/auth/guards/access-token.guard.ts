import { ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  mixin,
  type Type,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthSession } from '../../common/types/auth-session';
import { WideEventService } from '../../common/wide-event/wide-event.service';
import type { AuthRequest } from '../auth-request';
import { AuthCookieService } from '../services/auth-cookie.service';
import {
  type AuthTokenPayload,
  AuthTokenService,
} from '../services/auth-token.service';
import { extractBearerToken } from './bearer-token';

interface AccessTokenGuardPolicy {
  acceptsCookie: boolean;
  requiresAuthentication: boolean;
}

interface UnauthenticatedReason {
  code: ErrorCode;
  message: string;
}

function createAccessTokenGuard(
  policy: AccessTokenGuardPolicy,
): Type<CanActivate> {
  @Injectable()
  class AccessTokenGuard implements CanActivate {
    constructor(
      private readonly authTokenService: AuthTokenService,
      private readonly authCookieService: AuthCookieService,
      private readonly wideEventService: WideEventService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request: AuthRequest = context
        .switchToHttp()
        .getRequest<AuthRequest>();
      const accessToken: string | undefined = this.readAccessToken(request);
      if (!accessToken) {
        return this.continueUnauthenticated({
          code: ErrorCode.USER_TOKEN_MISSING,
          message: 'Token missing',
        });
      }

      const payload: AuthTokenPayload =
        await this.authTokenService.verifyAccessToken(accessToken);
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
      return true;
    }

    private readAccessToken(request: AuthRequest): string | undefined {
      const bearerToken: string | undefined = extractBearerToken(
        request.headers,
      );
      if (bearerToken !== undefined || !policy.acceptsCookie) {
        return bearerToken;
      }
      return this.authCookieService.readAccessToken(request.headers.cookie);
    }

    private continueUnauthenticated(reason: UnauthenticatedReason): true {
      if (policy.requiresAuthentication) {
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
  requiresAuthentication: true,
});

export const BearerAuthGuard: Type<CanActivate> = createAccessTokenGuard({
  acceptsCookie: false,
  requiresAuthentication: true,
});

export const OptionalAuthGuard: Type<CanActivate> = createAccessTokenGuard({
  acceptsCookie: true,
  requiresAuthentication: false,
});
