
import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { extractTokenFromHTTPHeader, extractTokenFromWsClient } from './utils';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private jwtService: JwtService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Détection du type de contexte
		const isHttp = context.getType() === 'http';
		const isWs = context.getType() === 'ws';

		let token: string | undefined;

		if (isHttp) {
			const request = context.switchToHttp().getRequest();
			token = extractTokenFromHTTPHeader(request);
			if (!token) throw new UnauthorizedException();
			request['user'] = await this.validateToken(token);
		}

		if (isWs) {
			const client = context.switchToWs().getClient();
			token = extractTokenFromWsClient(client);

			if (!token) {
				client.emit('error', { message: 'Unauthorized : token missing' });
				client.disconnect();
				return false;
			}
			try {
				client.user = await this.jwtService.verifyAsync(token, { secret: jwtConstants.secret });
			} catch {
				client.emit('error', { message: 'Unauthorized: invalid token' });
				client.disconnect();
				return false;
			}
		}

		return true;
	}

	private async validateToken(token: string) {
		try {
			return await this.jwtService.verifyAsync(token, { secret: jwtConstants.secret });
		} catch {
			throw new UnauthorizedException();
		}
	}
}
