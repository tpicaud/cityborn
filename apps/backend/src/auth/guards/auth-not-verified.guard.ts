import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { getJwtConstants } from '../constants';
import { extractTokenFromHTTPHeader } from '../utils';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@cityborn/errors';
import { validateAccessToken } from './utils';

@Injectable()
export class NotVerifiedAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Détection du type de contexte
    const isHttp = context.getType() === 'http';

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
      request['user'] = user;
    }

    return true;
  }
}
