import { ConnectedSocket, MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SessionService } from './session.service';
import { Server, Socket } from 'socket.io';
import { GameConfig, Guess } from '@cityborn/types';
import { BadRequestException, HttpStatus, Logger, UseFilters } from '@nestjs/common';
import { AuthenticatedGateway } from 'src/auth/auth.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '@cityborn/errors';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';

interface WSResponse {
	success: boolean,
	error?: {
		code: ErrorCode,
		message: string,
		statusCode: HttpStatus
	}
}

@WebSocketGateway()
@UseFilters(AllExceptionsFilter)
export class SessionGateway extends AuthenticatedGateway implements OnGatewayDisconnect {

	private readonly logger = new Logger(SessionGateway.name);

	constructor(
		private readonly sessionService: SessionService,
		configService: ConfigService,
		jwtService: JwtService
	) {
		super(jwtService, configService)
	}

	@WebSocketServer()
	io: Server;


	///////////////////
	// Session event //
	///////////////////

	@SubscribeMessage('session:join')
	async handleJoin(
		@ConnectedSocket() socket: Socket,
		@MessageBody('sessionID') sessionID: string,
		@MessageBody('playerID') playerID: string
	): Promise<WSResponse> {
		try {
			if (!sessionID || !playerID) {
				throw new BadRequestException({
					code: ErrorCode.UNKNOWN_ERROR,
					message: "sessionID et playerID required."
				});
			}

			const session = await this.sessionService.join(socket.id, sessionID, playerID);

			await socket.join(sessionID)
			this.io.to(sessionID).emit('session:update', session);

			this.logger.log(`${playerID} a rejoint la session ${sessionID}`);
			return { success: true };
		} catch (error) {
			this.logger.error(error.message)
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

	@SubscribeMessage('session:updateHost')
	async updateHost(
		@ConnectedSocket() socket: Socket,
		@MessageBody('newHostID') newHostID: string
	): Promise<WSResponse> {
		try {
			if (!newHostID) {
				throw new BadRequestException({
					code: ErrorCode.UNKNOWN_ERROR,
					message: "newHostID required."
				});
			}

			const session = await this.sessionService.updateHost(socket.id, newHostID);
			this.io.to(session.id).emit('session:update', session);

			return { success: true };
		} catch (error) {
			this.logger.error(error.message)
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

	@SubscribeMessage('session:updateGameConfig')
	async updateGameConfig(
		@ConnectedSocket() socket: Socket,
		@MessageBody('gameConfig') gameConfig: GameConfig
	): Promise<WSResponse> {
		try {
			if (!gameConfig) {
				throw new BadRequestException({
					code: ErrorCode.UNKNOWN_ERROR,
					message: "gameConfig required."
				});
			}

			const session = await this.sessionService.updateGameConfig(socket.id, gameConfig);
			this.io.to(session.id).emit('session:update', session);

			return { success: true };
		} catch (error) {
			this.logger.error(error.message)
			return {
				success: false,
				error: {
					code: error.response.code,
					message: error.message,
					statusCode: error.status
				}
			}
		}
	}

	@SubscribeMessage('session:startGame')
	async startGame(
		@ConnectedSocket() socket: Socket,
	): Promise<WSResponse> {
		try {
			const session = await this.sessionService.startGame(socket.id);

			this.io.to(session.id).emit('session:update', session);

			return { success: true };
		} catch (error) {
			this.logger.error(error.message)
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

	@SubscribeMessage('session:endGame')
	async endGame(
		@ConnectedSocket() socket: Socket,
	): Promise<WSResponse> {
		try {
			const session = await this.sessionService.endGame(socket.id);

			this.io.to(session.id).emit('session:update', session);

			return { success: true };
		} catch (error) {
			this.logger.error(error.message)
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

	////////////////////////
	// Current game event //
	////////////////////////

	@SubscribeMessage('session:guess')
	async handleGuess(
		@ConnectedSocket() socket: Socket,
		@MessageBody('guess') guess: Guess,
	): Promise<WSResponse> {
		try {
			if (!guess) {
				throw new BadRequestException({
					code: ErrorCode.UNKNOWN_ERROR,
					message: "guess required."
				});
			}

			const session = await this.sessionService.handleGuess(socket.id, guess);

			this.io.to(session.id).emit('session:update', session);
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

	@SubscribeMessage('session:nextRound')
	async handleNextRound(
		@ConnectedSocket() socket: Socket
	): Promise<WSResponse> {
		try {
			const session = await this.sessionService.handleNextRound(socket.id);

			this.io.to(session.id).emit('session:update', session);
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

	//////////////////////
	// Connection event //
	//////////////////////
	@SubscribeMessage('session:reconnect')
	async reconnect(
		@ConnectedSocket() socket: Socket,
		@MessageBody('sessionID') sessionID: string,
		@MessageBody('playerID') playerID: string
	): Promise<WSResponse & { isInGame?: boolean }> {
		try {
			if (!sessionID || !playerID) {
				throw new BadRequestException({
					code: ErrorCode.UNKNOWN_ERROR,
					message: "sessionID and playerID required."
				});
			}

			const session = await this.sessionService.reconnectPlayer(socket.id, sessionID, playerID);

			await socket.join(sessionID)
			this.io.to(sessionID).emit('session:update', session);

			this.logger.log(`${playerID} s'est reconnecté à la session ${sessionID}`);
			return { success: true };
		} catch (error) {
			this.logger.error(error.message)
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

	@SubscribeMessage('session:disonnect')
	async disconnect(
		@ConnectedSocket() socket: Socket,
	): Promise<void> {
		try {
			const session = await this.sessionService.disconnectPlayer(socket.id);

			await socket.leave(session.id);
			this.io.to(session.id).emit('session:update', session);

			this.logger.log(`Socket ${socket.id} déconnecté`);
		} catch (error) {
			this.logger.error(error.message);
		}
	}

	async handleDisconnect(@ConnectedSocket() socket: Socket) {
		try {
			await this.disconnect(socket);
		} catch (error) {
			this.logger.error(error.message);
		}
	}
}