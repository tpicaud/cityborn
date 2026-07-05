import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
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

    request.user =
      (await resolveFullUser(user.id, this.userService)) ?? undefined;

    return true;
  }
}
