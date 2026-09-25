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
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { UserService } from '../../user/user.service';
import { extractAccessTokenFromHttpRequest } from '../utils';
import {
  type AuthTokenPayload,
  resolveAuthSession,
  validateAccessToken,
} from './utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    private readonly userService: UserService,
    private readonly wideEventService: WideEventService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AppRequest = context.switchToHttp().getRequest<AppRequest>();
    const token: string | undefined =
      extractAccessTokenFromHttpRequest(request);
    if (!token)
      throw new UnauthorizedException({
        code: ErrorCode.USER_TOKEN_MISSING,
        message: 'Token missing',
      });

    const payload: AuthTokenPayload = await validateAccessToken(
      token,
      this.jwtService,
      this.authConfig.jwtAccessSecret,
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
    this.wideEventService.enrichAuth({
      userId: authSession.user.id,
      isAuthenticated: true,
    });

    return true;
  }
}
