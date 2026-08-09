import { ErrorCode, GameConfig, Guess, User } from '@cityborn/api';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
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
import { getJwtConstants } from '../auth/constants';
import { resolveFullUser, validateAccessToken } from '../auth/guards/utils';
import { extractAccessTokenFromWsClient } from '../auth/utils';
import { VisitorId } from '../common/decorators/visitor-id.decorator';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { CurrentUser } from '../user/user.decorator';
import { UserService } from '../user/user.service';
import { SessionService } from './session.service';

interface WSResponse {
  success: boolean;
  error?: {
    code: ErrorCode;
    message: string;
    statusCode: HttpStatus;
  };
}

interface AuthenticatedSocket extends Socket {
  visitorId?: string | string[];
  user?: User | null;
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
    private readonly userService: UserService,
  ) {}

  @WebSocketServer()
  io: Server;

  private toWSErrorResponse(error: unknown): WSResponse {
    if (error instanceof HttpException) {
      const responseBody = error.getResponse();
      const code =
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'code' in responseBody
          ? (responseBody.code as ErrorCode)
          : ErrorCode.UNKNOWN_ERROR;

      this.logger.error(error.message);
      return {
        success: false,
        error: { code, message: error.message, statusCode: error.getStatus() },
      };
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    this.logger.error(message);
    return {
      success: false,
      error: {
        code: ErrorCode.UNKNOWN_ERROR,
        message,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    };
  }

  async handleConnection(client: AuthenticatedSocket) {
    const visitorId = client.handshake?.query?.['x-visitor-id'];
    if (visitorId) {
      client.visitorId = visitorId;
    }

    const token = extractAccessTokenFromWsClient(client);
    if (!token) {
      client.user = null;
      return;
    }

    const payload = await validateAccessToken(
      token,
      this.jwtService,
      getJwtConstants(this.configService).jwt_access_secret,
    ).catch(() => null);

    if (payload) {
      const fullUser = await resolveFullUser(payload.id, this.userService);
      client.user = fullUser;
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
      return this.toWSErrorResponse(error);
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
      return this.toWSErrorResponse(error);
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
      return this.toWSErrorResponse(error);
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
      return this.toWSErrorResponse(error);
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
      return this.toWSErrorResponse(error);
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
      return this.toWSErrorResponse(error);
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
      return this.toWSErrorResponse(error);
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
      return this.toWSErrorResponse(error);
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
      this.logger.error(error instanceof Error ? error.message : error);
    }
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    try {
      await this.disconnect(socket);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : error);
    }
  }
}
