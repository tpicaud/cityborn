// jwt-refresh.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getJwtConstants } from '../constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService, private readonly configService: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        console.log('refresh')
        const request = context.switchToHttp().getRequest();
        const refreshToken = request.cookies?.refresh_token;
        if (!refreshToken) throw new UnauthorizedException('No refresh token provided');

        try {
            request.user = await this.validateAccessToken(refreshToken);
            return true;
        } catch (err) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private async validateAccessToken(token: string) {
        try {
            return await this.jwtService.verifyAsync(token, { secret: getJwtConstants(this.configService).jwt_refresh_secret });
        } catch {
            throw new UnauthorizedException();
        }
    }
}
