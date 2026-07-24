import { ErrorCode, User } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/user.service';
import { getJwtConstants } from '../constants';
import {
  extractAccessTokenFromWsClient,
  extractTokenFromHTTPHeader,
} from '../utils';
import { resolveFullUser, validateAccessToken } from './utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isHttp = context.getType() === 'http';
    const isWs = context.getType() === 'ws';

    let token: string | undefined;

    if (isHttp) {
      const request = context.switchToHttp().getRequest();
      token = extractTokenFromHTTPHeader(request);
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
    }

    if (isWs) {
      const client = context.switchToWs().getClient();
      token = extractAccessTokenFromWsClient(client);

      if (!token) {
        client.emit('error', { message: 'Unauthorized : token missing' });
        client.disconnect();
        return false;
      }
      try {
        const _user = await validateAccessToken(
          token,
          this.jwtService,
          getJwtConstants(this.configService).jwt_access_secret,
        );
      } catch (error) {
        client.emit('error', error);
        client.disconnect();
        return false;
      }
    }

    return true;
  }
}
