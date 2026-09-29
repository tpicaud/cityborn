import { ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  mixin,
  type Type,
  UnauthorizedException,
} from '@nestjs/common';
import type { AppRequest } from '../../common/types/app-request';
import type { AuthSession } from '../../common/types/auth-session';
import { AuthCookieService } from '../services/auth-cookie.service';
import {
  type AuthTokenPayload,
  AuthTokenService,
} from '../services/auth-token.service';
import { extractBearerToken } from './bearer-token';

type RefreshTokenTransport = 'bearer' | 'cookie';

function createRefreshTokenGuard(
  transport: RefreshTokenTransport,
): Type<CanActivate> {
  @Injectable()
  class RefreshTokenGuard implements CanActivate {
    constructor(
      private readonly authTokenService: AuthTokenService,
      private readonly authCookieService: AuthCookieService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request: AppRequest = context
        .switchToHttp()
        .getRequest<AppRequest>();
      const refreshToken: string | undefined = this.readRefreshToken(request);
      if (!refreshToken)
        throw new UnauthorizedException({
          code: ErrorCode.USER_INVALID_CREDENTIALS,
          message: 'No refresh token provided',
        });

      const payload: AuthTokenPayload =
        await this.authTokenService.verifyRefreshToken(refreshToken);
      const authSession: AuthSession | null =
        await this.authTokenService.resolveAuthSession(payload);
      if (!authSession) {
        throw new UnauthorizedException({
          code: ErrorCode.USER_NOT_FOUND,
          message: 'User not found',
        });
      }
      request.authSession = authSession;

      return true;
    }

    private readRefreshToken(request: AppRequest): string | undefined {
      if (transport === 'bearer') {
        return extractBearerToken(request.headers);
      }
      return this.authCookieService.readRefreshToken(request.headers.cookie);
    }
  }

  return mixin(RefreshTokenGuard);
}

export const BearerRefreshGuard: Type<CanActivate> =
  createRefreshTokenGuard('bearer');

export const CookieRefreshGuard: Type<CanActivate> =
  createRefreshTokenGuard('cookie');
