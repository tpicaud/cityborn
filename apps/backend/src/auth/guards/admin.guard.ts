import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { extractTokenFromHTTPHeader } from '../utils';
import { ErrorCode } from '@cityborn/errors';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let token: string | undefined;

    const request = context.switchToHttp().getRequest();
    token = extractTokenFromHTTPHeader(request);
    if (!token)
      throw new UnauthorizedException({
        code: ErrorCode.USER_TOKEN_MISSING,
        message: 'Token missing',
      });

    if (token !== process.env.ADMIN_DASHBOARD_TOKEN) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_TOKEN,
        message: 'Invalid token',
      });
    }

    return true;
  }
}
