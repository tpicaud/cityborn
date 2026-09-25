import { ErrorCode, User } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { UserService } from '../../user/user.service';
import { extractTokenFromHTTPHeader } from '../utils';
import { resolveFullUser, validateRefreshToken } from './utils';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const refreshToken =
      request.cookies?.refresh_token ?? extractTokenFromHTTPHeader(request);

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

    const fullUser = await resolveFullUser(
      decoded.id,
      this.userService,
      decoded.sessionVersion,
    );
    if (!fullUser) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }
    request.sessionVersion = decoded.sessionVersion;
    request.user = fullUser satisfies User;

    return true;
  }
}
