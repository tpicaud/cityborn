
import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getJwtConstants } from '../constants';
import { extractTokenFromHTTPHeader } from '../utils';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@cityborn/errors';

@Injectable()
export class NotVerifiedAuthGuard implements CanActivate {
	constructor(private jwtService: JwtService, private readonly configService: ConfigService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Détection du type de contexte
		const isHttp = context.getType() === 'http';

		let token: string | undefined;

		if (isHttp) {
			const request = context.switchToHttp().getRequest();
			token = extractTokenFromHTTPHeader(request);
			if (!token) throw new UnauthorizedException({ code: ErrorCode.USER_TOKEN_MISSING, message: 'Token missing' });

			const user = await this.validateAccessToken(token);
			request['user'] = user;
		}

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
