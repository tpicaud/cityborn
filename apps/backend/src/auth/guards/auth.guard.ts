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
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { UserService } from '../../user/user.service';
import { extractTokenFromHTTPHeader } from '../utils';
import {
  type AuthTokenPayload,
  resolveAuthenticationContext,
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
    const request = context.switchToHttp().getRequest<Request>();
    const token: string | undefined = extractTokenFromHTTPHeader(request);
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

    const authentication: AuthenticationContext | null =
      await resolveAuthenticationContext(payload, this.userService);
    if (!authentication) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }
    request.authentication = authentication;
    this.wideEventService.enrichAuth({
      userId: authentication.user.id,
      isAuthenticated: true,
    });

    return true;
  }
}
