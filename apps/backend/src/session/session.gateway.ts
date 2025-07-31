import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SessionService } from './session.service';
import { Server, Socket } from 'socket.io';
import { GameConfig } from '@cityborn/types';

interface WSResponse {
	success: boolean,
	error?: string
}

@WebSocketGateway()
export class SessionGateway {

	constructor(private readonly sessionService: SessionService) { }

	@WebSocketServer()
	io: Server;

	@SubscribeMessage('session:join')
	async handleJoin(
		@ConnectedSocket() socket: Socket,
		@MessageBody('sessionID') sessionID: string,
		@MessageBody('playerID') playerID: string
	): Promise<WSResponse> {
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

	@SubscribeMessage('session:updateHost')
	async updateHost(
		@ConnectedSocket() socket: Socket,
		@MessageBody('newHostID') newHostID: string
	): Promise<WSResponse> {
		try {
			if (!newHostID) throw new Error("Paramètres invalides : newHostID est requis.");

			const session = await this.sessionService.updateHost(socket.id, newHostID);
			this.io.to(session.id).emit('session:update', session);

			return { success: true };
		} catch (error) {
			console.log(error.message)
			return {
				success: false,
				error: error.message || "Une erreur inconnue s'est produite."
			};
		}
	}

	@SubscribeMessage('session:updateGameConfig')
	async updateGameConfig(
		@ConnectedSocket() socket: Socket,
		@MessageBody('gameConfig') gameConfig: GameConfig
	): Promise<WSResponse> {
		try {
			if (!gameConfig) throw new Error("Paramètres invalides : gameConfig est requis.");

			const session = await this.sessionService.updateGameConfig(socket.id, gameConfig);
			this.io.to(session.id).emit('session:update', session);

			return { success: true };
		} catch (error) {
			console.log(error.message)
			return {
				success: false,
				error: error.message || "Une erreur inconnue s'est produite."
			};
		}
	}

	@SubscribeMessage('session:startGame')
	async startGame(
		@ConnectedSocket() socket: Socket,
	): Promise<WSResponse> {
		try {
			const { session, gameID } = await this.sessionService.startGame(socket.id);

			this.io.to(session.id).emit('game:startGame', gameID);

			return { success: true };
		} catch (error) {
			console.log(error.message)
			return {
				success: false,
				error: error.message || "Une erreur inconnue s'est produite."
			};
		}
	}

	@SubscribeMessage('session:endGame')
	async endGame(
		@ConnectedSocket() socket: Socket,
	): Promise<WSResponse> {
		try {
			const session = await this.sessionService.endGame(socket.id);

			this.io.to(session.id).emit('session:update', session);

			return { success: true };
		} catch (error) {
			console.log(error.message)
			return {
				success: false,
				error: error.message || "Une erreur inconnue s'est produite."
			};
		}
	}

	@SubscribeMessage('session:reconnect')
	async reconnect(
		@ConnectedSocket() socket: Socket,
		@MessageBody('sessionID') sessionID: string,
		@MessageBody('playerID') playerID: string
	): Promise<WSResponse & { isInGame?: boolean }> {
		try {
			if (!sessionID || !playerID) throw new Error("Paramètres invalides : sessionID et playerID sont requis.");

			const { session, isInGame } = await this.sessionService.reconnectPlayer(socket.id, sessionID, playerID);

			await socket.join(sessionID)
			this.io.to(sessionID).emit('session:update', session);

			console.log(`${playerID} s'est reconnecté à la session ${sessionID}`);
			return { success: true, isInGame };
		} catch (error) {
			console.error("Erreur lors de la tentative de rejoindre la partie :", error);
			return {
				success: false,
				error: error.message || "Une erreur inconnue s'est produite."
			};
		}
	}

	@SubscribeMessage('session:disonnect')
	async disconnect(
		@ConnectedSocket() socket: Socket,
	): Promise<void> {
		try {
			const { session, game } = await this.sessionService.disconnectPlayer(socket.id);

			await socket.leave(session.id);
			this.io.to(session.id).emit('session:update', session);

			if (game && session && session.currentGameId) {
				await socket.leave(game.id);
				this.io.to(session.currentGameId).emit('game:update', game)
			}

			console.log(`Socket ${socket.id} déconnecté`);
		} catch (error) {
			console.log(`Erreur lors de la déconnexion du socket ${socket.id}: ${error.message}`);
		}
	}
}
