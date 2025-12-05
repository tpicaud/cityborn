import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  extractTokenFromHTTPHeader,
  extractAccessTokenFromWsClient,
} from '../utils';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@cityborn/errors';
import { validateAccessToken } from './utils';
import { getJwtConstants } from '../constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Détection du type de contexte
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
        getJwtConstants(this.configService).jwt_refresh_secret,
      );

      if (!user.isVerified)
        throw new UnauthorizedException({
          code: ErrorCode.USER_NOT_VERIFIED,
          message: 'User email not verified',
        });

      request['user'] = user;
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
        const user = await validateAccessToken(
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
