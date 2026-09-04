import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { UserService } from '../../user/user.service';
import { getJwtConstants } from '../constants';
import { extractTokenFromHTTPHeader } from '../utils';
import { resolveFullUser, validateAccessToken } from './utils';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
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
      getJwtConstants(this.configService).jwt_access_secret,
    );

    const fullUser =
      (await resolveFullUser(user.id, this.userService)) ?? undefined;
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
