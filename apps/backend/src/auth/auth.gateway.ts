import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";
import { getJwtConstants } from "src/auth/constants";
import { extractAccessTokenFromWsClient } from "./utils";
import { ConfigService } from "@nestjs/config";

export abstract class AuthenticatedGateway {
    constructor(private readonly jwtService: JwtService, private readonly configService: ConfigService) { }

    async handleConnection(client: Socket) {
        const token = extractAccessTokenFromWsClient(client);
        if (!token) {
            (client as any).user = null;
            return;
        }
        // if (!token) {
        //     client.emit('error', { message: 'Unauthorized: token missing' });
        //     client.disconnect();
        //     return;
        // }

        try {
            (client as any).user = await this.jwtService.verifyAsync(token, { secret: getJwtConstants(this.configService).jwt_access_secret }).catch(() => null);
        } catch {
            client.emit('error', { message: 'Unauthorized: invalid token' });
            client.disconnect();
            return;
        }
    }
}