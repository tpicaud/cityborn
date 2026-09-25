import { ErrorCode, User } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { UserService } from '../../user/user.service';
import {
  extractRefreshTokenFromCookie,
  extractTokenFromHTTPHeader,
} from '../utils';
import { resolveFullUser, validateRefreshToken } from './utils';

@Injectable()
abstract class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    private readonly userService: UserService,
  ) {}

  protected abstract extractRefreshToken(request: Request): string | undefined;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const refreshToken: string | undefined = this.extractRefreshToken(request);

    if (!refreshToken)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'No refresh token provided',
      });

    const decoded = await validateRefreshToken(
      refreshToken,
      this.jwtService,
      this.authConfig.jwtRefreshSecret,
    );

    const fullUser = await resolveFullUser(decoded.id, this.userService);
    if (!fullUser) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }
    request.user = fullUser satisfies User;

    return true;
  }
}

@Injectable()
export class BearerRefreshGuard extends RefreshTokenGuard {
  protected extractRefreshToken(request: Request): string | undefined {
    return extractTokenFromHTTPHeader(request);
  }
}

@Injectable()
export class CookieRefreshGuard extends RefreshTokenGuard {
  protected extractRefreshToken(request: Request): string | undefined {
    return extractRefreshTokenFromCookie(request);
  }
}
