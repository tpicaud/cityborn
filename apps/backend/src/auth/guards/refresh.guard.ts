import { ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AppRequest } from '../../common/types/app-request';
import type { AuthSession } from '../../common/types/auth-session';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { UserService } from '../../user/user.service';
import { extractTokenFromHTTPHeader } from '../utils';
import {
  type AuthTokenPayload,
  resolveAuthSession,
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
    const request = context.switchToHttp().getRequest<AppRequest>();
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

    const authSession: AuthSession | null = await resolveAuthSession(
      payload,
      this.userService,
    );
    if (!authSession) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }
    request.authSession = authSession;

    return true;
  }
}
