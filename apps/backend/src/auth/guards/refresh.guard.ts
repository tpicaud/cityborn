// jwt-refresh.guard.ts

import { ErrorCode } from '@cityborn/errors';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getJwtConstants } from '../constants';
import { extractTokenFromHTTPHeader } from '../utils';
import { validateRefreshToken } from './utils';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    request.user = await validateRefreshToken(
      refreshToken,
      this.jwtService,
      getJwtConstants(this.configService).jwt_refresh_secret,
    );

    return true;
  }
}
