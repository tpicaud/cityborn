import { ErrorCode, User } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { UserService } from '../../user/user.service';
import { extractTokenFromHTTPHeader } from '../utils';
import { resolveFullUser, validateAccessToken } from './utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    private readonly userService: UserService,
    private readonly wideEventService: WideEventService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHTTPHeader(request);
    if (!token)
      throw new UnauthorizedException({
        code: ErrorCode.USER_TOKEN_MISSING,
        message: 'Token missing',
      });

    const user = await validateAccessToken(
      token,
      this.jwtService,
      this.authConfig.jwtAccessSecret,
    );

    const fullUser = await resolveFullUser(
      user.id,
      this.userService,
      user.sessionVersion,
    );
    if (!fullUser) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }
    request.user = fullUser satisfies User;
    this.wideEventService.enrichAuth({
      userId: fullUser.id,
      isAuthenticated: true,
    });

    return true;
  }
}
