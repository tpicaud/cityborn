import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SessionService } from './session.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class SessionGateway {

	constructor(private readonly sessionService: SessionService) { }

	@WebSocketServer()
	io: Server;

	@SubscribeMessage('session:join')
	async handleMessage(
		@ConnectedSocket() socket: Socket,
		@MessageBody('sessionID') sessionID: string,
		@MessageBody('playerID') playerID: string
	): Promise<{ success: boolean; error?: string; }> {
		try {
			if (!sessionID || !playerID) throw new Error("Paramètres invalides : sessionID et playerID sont requis.");

			const session = await this.sessionService.join(socket.id, sessionID, playerID);

			await socket.join(sessionID)
			this.io.to(sessionID).emit('session:update', session);

			console.log(`${playerID} a rejoint la session ${sessionID}`);
			return { success: true };
		} catch (error) {
			console.error("Erreur lors de la tentative de rejoindre la partie :", error);
			return {
				success: false,
				error: error.message || "Une erreur inconnue s'est produite."
			};
		}
	}
}
