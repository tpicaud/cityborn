import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Guess } from '@cityborn/types';
import { BadRequestException, HttpStatus, Logger } from '@nestjs/common';
import { AuthenticatedGateway } from 'src/auth/auth.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@cityborn/errors';

interface WSResponse {
	success: boolean,
	error?: {
		code: ErrorCode,
		message: string,
		statusCode: HttpStatus
	}
}

@WebSocketGateway()
export class GameGateway extends AuthenticatedGateway {

	private readonly logger = new Logger(GameGateway.name);

	constructor(
		private readonly gameService: GameService,
		configService: ConfigService,
		jwtService: JwtService
	) {
		super(jwtService, configService);
	}

	@WebSocketServer()
	io: Server;

	@SubscribeMessage('game:join')
	async handleJoin(
		@ConnectedSocket() socket: Socket,
		@MessageBody('gameID') gameID: string,
	): Promise<WSResponse> {
		try {
			if (!gameID) {
				throw new BadRequestException({
					code: ErrorCode.UNKNOWN_ERROR,
					message: "gameID required."
				});
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
				error: {
					code: error.response.code,
					message: error.message,
					statusCode: error.status
				}
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
				throw new BadRequestException({
					code: ErrorCode.UNKNOWN_ERROR,
					message: "guess and playerID required."
				});
			}

			const game = await this.gameService.handleGuess(socket.id, guess);

			this.io.to(game.id).emit('game:update', game);
			return { success: true };
		} catch (error) {
			this.logger.error(error.message);
			return {
				success: false,
				error: {
					code: error.response.code,
					message: error.message,
					statusCode: error.status
				}
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
				error: {
					code: error.response.code,
					message: error.message,
					statusCode: error.status
				}
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
				error: {
					code: error.response.code,
					message: error.message,
					statusCode: error.status
				}
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
			if (!gameID || !playerID) {
				throw new BadRequestException({
					code: ErrorCode.UNKNOWN_ERROR,
					message: "gameID and playerID required."
				});
			}

			const game = await this.gameService.reconnectPlayer(socket.id, gameID);

			await socket.join(gameID);
			this.io.to(game.id).emit('game:update', game);

			this.logger.log(`${playerID} s'est reconnecté à la partie ${gameID}`);
			return { success: true };
		} catch (error) {
			this.logger.error(error.message);
			return {
				success: false,
				error: {
					code: error.response.code,
					message: error.message,
					statusCode: error.status
				}
			};
		}
	}
}
