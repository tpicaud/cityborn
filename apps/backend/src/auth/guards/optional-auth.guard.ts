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
import { ErrorCode } from '@cityborn/errors';
import { UserService } from 'src/user/user.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly userService: UserService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = extractTokenFromHTTPHeader(request);

        if (!token) {
            return true;
        }

        const user = await this.validateAccessToken(token);
        if (!user.isVerified) return true;
        
        const fullUser = await this.userService.findById(user.id);

        request['user'] = fullUser;
        return true;
    }

    private async validateAccessToken(token: string) {
        try {
            return await this.jwtService.verifyAsync(token, { secret: getJwtConstants(this.configService).jwt_access_secret });
        } catch {
            throw new UnauthorizedException({ code: ErrorCode.USER_INVALID_TOKEN, message: 'Invalid token' });
        }
    }
}
