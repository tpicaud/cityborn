import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Guess } from '@cityborn/types';
import { Logger } from '@nestjs/common';

interface WSResponse {
	success: boolean,
	error?: string
}

@WebSocketGateway()
export class GameGateway {

	private readonly logger = new Logger(GameGateway.name);

	constructor(private readonly gameService: GameService) { }

	@WebSocketServer()
	io: Server;

	@SubscribeMessage('game:join')
	async handleJoin(
		@ConnectedSocket() socket: Socket,
		@MessageBody('gameID') gameID: string,
	): Promise<WSResponse> {
		try {
			if (!gameID === undefined) {
				throw new Error("Paramètres invalides : gameID est requis.");
			}

			const game = await this.gameService.join(socket.id, gameID);

			await socket.join(gameID);
			this.io.to(game.id).emit('game:update', game);

			this.logger.log(`${socket.id} a rejoint la game ${gameID}`);
			return { success: true };
		} catch (error) {
			this.logger.error(error.message);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
			};
		}
	}

	@SubscribeMessage('game:guess')
	async handleGuess(
		@ConnectedSocket() socket: Socket,
		@MessageBody('guess') guess: Guess,
	): Promise<WSResponse> {
		try {
			if (!guess) {
				throw new Error("Paramètres invalides : guess est requis.");
			}

			const game = await this.gameService.handleGuess(socket.id, guess);

			this.io.to(game.id).emit('game:update', game);
			return { success: true };
		} catch (error) {
			this.logger.error(error.message);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
			};
		}
	}

	@SubscribeMessage('game:nextRound')
	async handleNextRound(
		@ConnectedSocket() socket: Socket
	): Promise<WSResponse> {
		try {
			const game = await this.gameService.handleNextRound(socket.id);

			this.io.to(game.id).emit('game:update', game);
			return { success: true };
		} catch (error) {
			this.logger.error(error.message);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
			};
		}
	}

	@SubscribeMessage('game:end')
	async handleEnd(
		@ConnectedSocket() socket: Socket
	): Promise<WSResponse> {
		try {
			await this.gameService.endGame(socket.id);

			return { success: true };
		} catch (error) {
			this.logger.error(error.message);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
			};
		}
	}

	@SubscribeMessage('game:reconnect')
	async handleReconnect(
		@ConnectedSocket() socket: Socket,
		@MessageBody('gameID') gameID: string,
		@MessageBody('playerID') playerID: string
	): Promise<WSResponse> {
		try {
			if (!gameID || !playerID) throw new Error("Paramètres invalides : sessionID et playerID sont requis.");

			const game = await this.gameService.reconnectPlayer(socket.id, gameID);

			await socket.join(gameID);
			this.io.to(game.id).emit('game:update', game);

			this.logger.log(`${playerID} s'est reconnecté à la partie ${gameID}`);
			return { success: true };
		} catch (error) {
			this.logger.error(error.message);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Une erreur inconnue s'est produite."
			};
		}
	}
}
