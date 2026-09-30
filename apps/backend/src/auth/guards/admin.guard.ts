import { ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { extractBearerToken } from './bearer-token';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const token: string | undefined = extractBearerToken(request.headers);
    if (!token)
      throw new UnauthorizedException({
        code: ErrorCode.USER_TOKEN_MISSING,
        message: 'Token missing',
      });

    if (token !== this.authConfig.adminDashboardToken) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_TOKEN,
        message: 'Invalid token',
      });
    }

    return true;
  }
}
