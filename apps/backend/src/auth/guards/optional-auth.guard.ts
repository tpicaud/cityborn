import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getJwtConstants } from '../constants';
import { Request } from 'express';
import { extractTokenFromHTTPHeader } from '../utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService, private readonly configService: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = extractTokenFromHTTPHeader(request);


        if (!token) {
            return true;
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: getJwtConstants(this.configService).jwt_access_secret,
            });
            request['user'] = payload;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }
}
