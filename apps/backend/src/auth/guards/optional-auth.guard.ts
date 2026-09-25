import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { UserService } from '../../user/user.service';
import { extractTokenFromHTTPHeader } from '../utils';
import { resolveFullUser, validateAccessToken } from './utils';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    private readonly userService: UserService,
    private readonly wideEventService: WideEventService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractTokenFromHTTPHeader(request);

    if (!token) {
      this.wideEventService.enrichAuth({ isAuthenticated: false });
      return true;
    }

    const user = await validateAccessToken(
      token,
      this.jwtService,
      this.authConfig.jwtAccessSecret,
    );

    const fullUser =
      (await resolveFullUser(user.id, this.userService, user.sessionVersion)) ??
      undefined;
    request.user = fullUser;
    if (!fullUser) {
      this.wideEventService.enrichAuth({ isAuthenticated: false });
      return true;
    }
    this.wideEventService.enrichAuth({
      isAuthenticated: true,
      userId: fullUser.id,
    });

    return true;
  }
}
