import { ErrorCode, User } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WideEventService } from '../../common/wide-event/wide-event.service';
import { UserService } from '../../user/user.service';
import { getJwtConstants } from '../constants';
import { extractTokenFromHTTPHeader } from '../utils';
import { resolveFullUser, validateAccessToken } from './utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
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
      getJwtConstants(this.configService).jwt_access_secret,
    );

    const fullUser = await resolveFullUser(user.id, this.userService);
    if (!fullUser) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }
    request.user = fullUser satisfies User;
    this.wideEventService.enrich({
      userId: fullUser.id,
      isAuthenticated: true,
    });

    return true;
  }
}
