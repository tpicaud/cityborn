import { GameConfig, Guess, User } from '@cityborn/api';
import { ErrorCode } from '@cityborn/errors';
import {
  BadRequestException,
  type HttpStatus,
  Logger,
  UseFilters,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getJwtConstants } from 'src/auth/constants';
import { validateAccessToken } from 'src/auth/guards/utils';
import { extractAccessTokenFromWsClient } from 'src/auth/utils';
import { VisitorId } from 'src/common/decorators/visitor-id.decorator';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { CurrentUser } from 'src/user/user.decorator';
import { SessionService } from './session.service';

interface WSResponse {
  success: boolean;
  error?: {
    code: ErrorCode;
    message: string;
    statusCode: HttpStatus;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
})
@UseFilters(AllExceptionsFilter)
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SessionGateway.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @WebSocketServer()
  io: Server;

  async handleConnection(client: Socket) {
    const visitorId = client.handshake?.query?.['x-visitor-id'];
    if (visitorId) {
      (client as any).visitorId = visitorId;
    }

    const token = extractAccessTokenFromWsClient(client);
    if (!token) {
      (client as any).user = null;
      return;
    }

    const payload = await validateAccessToken(
      token,
      this.jwtService,
      getJwtConstants(this.configService).jwt_access_secret,
    ).catch(() => null);

    if (payload) {
      (client as any).user = payload;
    }
  }

  ///////////////////
  // Session event //
  ///////////////////

  @SubscribeMessage('session:join')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @CurrentUser() user: User,
    @MessageBody('sessionID') sessionID: string,
    @MessageBody('playerID') playerID: string,
  ): Promise<WSResponse> {
    try {
      if (!sessionID || !playerID) {
        throw new BadRequestException({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'sessionID et playerID required.',
        });
      }

      const session = await this.sessionService.join(
        socket.id,
        sessionID,
        playerID,
        user,
      );

      await socket.join(session.id);
      this.io.to(session.id).emit('session:update', session);

      this.logger.log(`${playerID} a rejoint la session ${sessionID}`);
      return { success: true };
    } catch (error) {
      this.logger.error(error.message);
      return {
        success: false,
        error: {
          code: error.response.code,
          message: error.message,
          statusCode: error.status,
        },
      };
    }
  }

  @SubscribeMessage('session:updateHost')
  async updateHost(
    @ConnectedSocket() socket: Socket,
    @MessageBody('newHostID') newHostID: string,
  ): Promise<WSResponse> {
    try {
      if (!newHostID) {
        throw new BadRequestException({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'newHostID required.',
        });
      }

      const session = await this.sessionService.updateHost(
        socket.id,
        newHostID,
      );
      this.io.to(session.id).emit('session:update', session);

      return { success: true };
    } catch (error) {
      this.logger.error(error.message);
      return {
        success: false,
        error: {
          code: error.response.code,
          message: error.message,
          statusCode: error.status,
        },
      };
    }
  }

  @SubscribeMessage('session:updateGameConfig')
  async updateGameConfig(
    @ConnectedSocket() socket: Socket,
    @MessageBody('gameConfig') gameConfig: GameConfig,
  ): Promise<WSResponse> {
    try {
      if (!gameConfig) {
        throw new BadRequestException({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'gameConfig required.',
        });
      }

      const session = await this.sessionService.updateGameConfig(
        socket.id,
        gameConfig,
      );
      this.io.to(session.id).emit('session:update', session);

      return { success: true };
    } catch (error) {
      this.logger.error(error.message);
      return {
        success: false,
        error: {
          code: error.response.code,
          message: error.message,
          statusCode: error.status,
        },
      };
    }
  }

  ////////////////////////
  // Current game event //
  ////////////////////////

  @SubscribeMessage('session:startGame')
  async startGame(
    @ConnectedSocket() socket: Socket,
    @VisitorId() visitorId?: string,
  ): Promise<WSResponse> {
    try {
      const session = await this.sessionService.startGame(socket.id, visitorId);

      this.io.to(session.id).emit('session:update', session);

      return { success: true };
    } catch (error) {
      this.logger.error(error.message);
      return {
        success: false,
        error: {
          code: error.response.code,
          message: error.message,
          statusCode: error.status,
        },
      };
    }
  }

  @SubscribeMessage('session:guess')
  async handleGuess(
    @ConnectedSocket() socket: Socket,
    @MessageBody('guess') guess: Guess,
  ): Promise<WSResponse> {
    try {
      if (!guess) {
        throw new BadRequestException({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'guess required.',
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
          statusCode: error.status,
        },
      };
    }
  }

  @SubscribeMessage('session:nextRound')
  async handleNextRound(
    @ConnectedSocket() socket: Socket,
    @VisitorId() visitorId?: string,
  ): Promise<WSResponse> {
    try {
      const session = await this.sessionService.handleNextRound(
        socket.id,
        visitorId,
      );

      this.io.to(session.id).emit('session:update', session);
      return { success: true };
    } catch (error) {
      this.logger.error(error.message);
      return {
        success: false,
        error: {
          code: error.response.code,
          message: error.message,
          statusCode: error.status,
        },
      };
    }
  }

  @SubscribeMessage('session:playAgain')
  async playAgain(
    @ConnectedSocket() socket: Socket,
    @VisitorId() visitorId?: string,
  ): Promise<WSResponse> {
    try {
      // Start new one
      const session = await this.sessionService.startGame(socket.id, visitorId);

      this.io.to(session.id).emit('session:update', session);

      return { success: true };
    } catch (error) {
      this.logger.error(error.message);
      return {
        success: false,
        error: {
          code: error.response.code,
          message: error.message,
          statusCode: error.status,
        },
      };
    }
  }

  //////////////////////
  // Connection event //
  //////////////////////

  @SubscribeMessage('session:reconnect')
  async reconnect(
    @ConnectedSocket() socket: Socket,
    @CurrentUser() user: User,
    @MessageBody('sessionID') sessionID: string,
    @MessageBody('playerID') playerID: string,
  ): Promise<WSResponse & { isInGame?: boolean }> {
    try {
      if (!sessionID || !playerID) {
        throw new BadRequestException({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'sessionID and playerID required.',
        });
      }

      const session = await this.sessionService.reconnectPlayer(
        socket.id,
        sessionID,
        playerID,
        user,
      );

      await socket.join(sessionID);
      this.io.to(sessionID).emit('session:update', session);

      this.logger.log(`${playerID} s'est reconnecté à la session ${sessionID}`);
      return { success: true };
    } catch (error) {
      this.logger.error(error.message);
      return {
        success: false,
        error: {
          code: error.response.code,
          message: error.message,
          statusCode: error.status,
        },
      };
    }
  }

  @SubscribeMessage('session:disonnect')
  async disconnect(@ConnectedSocket() socket: Socket): Promise<void> {
    try {
      const session = await this.sessionService.disconnectPlayer(socket.id);
      if (!session) return;

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
