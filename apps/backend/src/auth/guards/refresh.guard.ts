import { ErrorCode, type User } from '@cityborn/api';
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
import { validateRefreshToken } from './utils';

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

    const authenticationState =
      await this.userService.findAuthenticationStateById(decoded.id);
    if (!authenticationState) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }
    if (authenticationState.authVersion !== decoded.authVersion) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_TOKEN,
        message: 'Token has been revoked',
      });
    }
    request.user = authenticationState.user satisfies User;
    request.authVersion = decoded.authVersion;

    return true;
  }
}
