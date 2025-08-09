
import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';

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
			token = this.extractTokenFromHeader(request.headers.authorization);
			if (!token) throw new UnauthorizedException();
			request['user'] = await this.validateToken(token);
		}

		if (isWs) {
			const client = context.switchToWs().getClient();
			// Pour socket.io
			token = this.extractTokenFromHeader(client.handshake?.headers?.authorization);
			// ou via query : client.handshake?.query?.token
			if (!token) throw new UnauthorizedException();
			client.user = await this.validateToken(token);
		}

		return true;
	}
	// async canActivate(context: ExecutionContext): Promise<boolean> {
	//   const request = context.switchToHttp().getRequest();
	//   const token = this.extractTokenFromHeader(request);
	//   if (!token) {
	//     throw new UnauthorizedException();
	//   }
	//   try {
	//     const payload = await this.jwtService.verifyAsync(
	//       token,
	//       {
	//         secret: jwtConstants.secret
	//       }
	//     );
	//     // 💡 We're assigning the payload to the request object here
	//     // so that we can access it in our route handlers
	//     request['user'] = payload;
	//   } catch {
	//     throw new UnauthorizedException();
	//   }
	//   return true;
	// }

	private extractTokenFromHeader(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}

	private async validateToken(token: string) {
		try {
			return await this.jwtService.verifyAsync(token, { secret: jwtConstants.secret });
		} catch {
			throw new UnauthorizedException();
		}
	}
}
