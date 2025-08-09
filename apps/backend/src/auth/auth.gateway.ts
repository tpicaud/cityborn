import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";
import { jwtConstants } from "src/auth/constants";
import { extractTokenFromWsClient } from "./utils";

export abstract class AuthenticatedGateway {
    constructor(private readonly jwtService: JwtService) {}

    async handleConnection(client: Socket) {
        const token = extractTokenFromWsClient(client);
        if (!token) {
            client.emit('error', { message: 'Unauthorized: token missing' });
            client.disconnect();
            return;
        }

        try {
            (client as any).user = await this.jwtService.verifyAsync(token, { secret: jwtConstants.secret });
        } catch {
            client.emit('error', { message: 'Unauthorized: invalid token' });
            client.disconnect();
            return;
        }
    }
}