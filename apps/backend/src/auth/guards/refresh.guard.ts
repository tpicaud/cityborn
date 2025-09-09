// jwt-refresh.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getJwtConstants } from '../constants';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@cityborn/errors';

@Injectable()
export class RefreshGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService, private readonly configService: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const refreshToken = request.cookies?.refresh_token;
        if (!refreshToken) throw new UnauthorizedException({ code: ErrorCode.USER_INVALID_CREDENTIALS, message: 'No refresh token provided' });

        try {
            request.user = await this.validateRefreshToken(refreshToken);
            return true;
        } catch (err) {
            throw new UnauthorizedException({ code: ErrorCode.USER_INVALID_CREDENTIALS, message: 'Invalid refresh token' });
        }
    }

    private async validateRefreshToken(token: string) {
        return await this.jwtService.verifyAsync(token, { secret: getJwtConstants(this.configService).jwt_refresh_secret });
    }
}
