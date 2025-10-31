import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { extractTokenFromHTTPHeader } from '../utils';

@Injectable()
export class OptionalAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHTTPHeader(request);

    if (token && token === process.env.ADMIN_DASHBOARD_TOKEN) {
      request.admin = true;
    } else {
      request.admin = false;
    }

    return true;
  }
}
