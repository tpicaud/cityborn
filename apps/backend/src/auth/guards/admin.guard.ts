import { ErrorCode } from '@cityborn/api';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_CONFIG, type AuthConfig } from '../../config/config.module';
import { extractTokenFromHTTPHeader } from '../utils';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHTTPHeader(request);
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
