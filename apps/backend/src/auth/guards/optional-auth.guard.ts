import { ErrorCode } from '@cityborn/errors';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { UserService } from 'src/user/user.service';
import { getJwtConstants } from '../constants';
import { extractTokenFromHTTPHeader } from '../utils';
import { validateAccessToken } from './utils';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = extractTokenFromHTTPHeader(request);

    if (!token) {
      return true;
    }

    const user = await validateAccessToken(
      token,
      this.jwtService,
      getJwtConstants(this.configService).jwt_access_secret,
    );

    const fullUser = await this.userService.findById(user.id);

    request['user'] = fullUser;
    return true;
  }
}
