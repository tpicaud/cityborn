import { ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthenticationContext } from '../../common/types/authentication';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { UserService } from '../../user/user.service';
import { extractTokenFromHTTPHeader } from '../utils';
import {
  type AuthTokenPayload,
  resolveAuthenticationContext,
  validateRefreshToken,
} from './utils';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken: string | undefined =
      request.cookies?.refresh_token ?? extractTokenFromHTTPHeader(request);

    if (!refreshToken)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'No refresh token provided',
      });

    const payload: AuthTokenPayload = await validateRefreshToken(
      refreshToken,
      this.jwtService,
      this.authConfig.jwtRefreshSecret,
    );

    const authentication: AuthenticationContext | null =
      await resolveAuthenticationContext(payload, this.userService);
    if (!authentication) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }
    request.authentication = authentication;

    return true;
  }
}
