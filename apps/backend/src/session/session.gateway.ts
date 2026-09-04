import {
  type ApiError,
  ErrorCode,
  GameConfig,
  Guess,
  type Session,
  User,
} from '@cityborn/api';
import {
  BadRequestException,
  Logger,
  NotFoundException,
  UseFilters,
  UseInterceptors,
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
import { exceptionToApiError } from '../common/errors/exception-to-api-error';
import { DefaultExceptionFilter } from '../common/filters/default-exception.filter';
import { logWsApiError } from '../common/filters/utils';
import { WsErrorInterceptor } from '../common/interceptors/ws-error.interceptor';
import type { SessionSocket } from '../common/types/session-socket';
import { WideEventService } from '../common/wide-event/wide-event.service';
import {
  type ConnectionInfo,
  ConnectionRegistryService,
} from '../connection-registry/connection-registry.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { resolveClientIpFromHeaders } from '../rate-limit/resolve-client-ip';
import { CurrentUser } from '../user/user.decorator';
import { UserService } from '../user/user.service';
import { SessionService } from './session.service';

interface WSResponse {
  success: boolean;
  error?: ApiError;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
})
@UseFilters(DefaultExceptionFilter)
@UseInterceptors(WsErrorInterceptor)
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SessionGateway.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly connectionRegistryService: ConnectionRegistryService,
    private readonly rateLimitService: RateLimitService,
    private readonly wideEventService: WideEventService,
  ) {}

  @WebSocketServer()
  io!: Server;

  private async resolveConnection(socketID: string): Promise<ConnectionInfo> {
    const connection =
      await this.connectionRegistryService.getConnection(socketID);
    if (!connection)
      throw new NotFoundException({
        code: ErrorCode.CONNECTION_NOT_FOUND,
        message: 'No connection associated with this socket',
      });

    this.wideEventService.enrich({
      sessionId: connection.sessionID,
      playerId: connection.playerID,
    });

    return connection;
  }

  private enrichGame(session: Session): void {
    if (session.currentGame) {
      this.wideEventService.enrich({ gameId: session.currentGame.id });
    }
  }

  async handleConnection(client: SessionSocket) {
    try {
      await this.rateLimitService.consumeWsConnection(
        resolveClientIpFromHeaders(
          client.handshake.headers,
          client.handshake.address,
        ),
      );
    } catch (error) {
      const apiError: ApiError = exceptionToApiError(error);
      logWsApiError(this.logger, 'WS Connection Error', apiError, error);
      client.emit('error', apiError);
      client.disconnect(true);
      return;
    }

    const visitorId = client.handshake?.query?.['x-visitor-id'];
    if (visitorId) {
      client.data.visitorId = visitorId;
    }

    const token = extractAccessTokenFromWsClient(client);
    if (!token) {
      client.data.user = null;
      return;
    }

    const payload = await validateAccessToken(
      token,
      this.jwtService,
      getJwtConstants(this.configService).jwt_access_secret,
    ).catch(() => null);

    if (!payload) return;

    try {
      client.data.user = await resolveFullUser(payload.id, this.userService);
    } catch (error) {
      const apiError: ApiError = exceptionToApiError(error);
      logWsApiError(this.logger, 'WS Connection Error', apiError, error);
      client.data.user = undefined;
    }
  }

  ///////////////////
  // Session event //
  ///////////////////

  @SubscribeMessage('session:join')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @CurrentUser() user: User | undefined,
    @MessageBody('sessionID') sessionID: string,
    @MessageBody('playerID') playerID: string,
  ): Promise<WSResponse> {
    if (!sessionID || !playerID) {
      throw new BadRequestException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'sessionID et playerID required.',
      });
    }

    this.wideEventService.enrich({ sessionId: sessionID, playerId: playerID });

    const session = await this.sessionService.join(sessionID, playerID, user);
    await this.connectionRegistryService.register(
      socket.id,
      playerID,
      sessionID,
      !user,
    );

    await socket.join(session.id);
    this.io.to(session.id).emit('session:update', session);

    return { success: true };
  }

  @SubscribeMessage('session:updateHost')
  async updateHost(
    @ConnectedSocket() socket: Socket,
    @MessageBody('newHostID') newHostID: string,
  ): Promise<WSResponse> {
    if (!newHostID) {
      throw new BadRequestException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'newHostID required.',
      });
    }

    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.updateHost(
      playerID,
      sessionID,
      newHostID,
    );
    this.io.to(session.id).emit('session:update', session);

    return { success: true };
  }

  @SubscribeMessage('session:updateGameConfig')
  async updateGameConfig(
    @ConnectedSocket() socket: Socket,
    @MessageBody('gameConfig') gameConfig: GameConfig,
  ): Promise<WSResponse> {
    if (!gameConfig) {
      throw new BadRequestException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'gameConfig required.',
      });
    }

    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.updateGameConfig(
      playerID,
      sessionID,
      gameConfig,
    );
    this.io.to(session.id).emit('session:update', session);

    return { success: true };
  }

  @SubscribeMessage('session:kickPlayer')
  async kickPlayer(
    @ConnectedSocket() socket: Socket,
    @MessageBody('playerToKick') playerToKick: string,
  ): Promise<WSResponse> {
    if (!playerToKick) {
      throw new BadRequestException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'playerToKick required.',
      });
    }

    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.kickPlayer(
      playerID,
      sessionID,
      playerToKick,
    );

    const socketsInRoom = await this.io.in(sessionID).fetchSockets();
    for (const remoteSocket of socketsInRoom) {
      const connection = await this.connectionRegistryService.getConnection(
        remoteSocket.id,
      );
      if (connection?.playerID === playerToKick) {
        remoteSocket.emit('session:kicked');
        remoteSocket.leave(sessionID);
        await this.connectionRegistryService.unregister(remoteSocket.id);
      }
    }

    this.io.to(session.id).emit('session:update', session);

    return { success: true };
  }

  ////////////////////////
  // Current game event //
  ////////////////////////

  @SubscribeMessage('session:startGame')
  async startGame(
    @ConnectedSocket() socket: Socket,
    @VisitorId() visitorId?: string,
  ): Promise<WSResponse> {
    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.startGame(
      playerID,
      sessionID,
      visitorId,
    );
    this.enrichGame(session);

    this.io.to(session.id).emit('session:update', session);

    return { success: true };
  }

  @SubscribeMessage('session:guess')
  async handleGuess(
    @ConnectedSocket() socket: Socket,
    @MessageBody('guess') guess: Guess,
  ): Promise<WSResponse> {
    if (!guess) {
      throw new BadRequestException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'guess required.',
      });
    }

    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.handleGuess(
      playerID,
      sessionID,
      guess,
    );
    this.enrichGame(session);

    this.io.to(session.id).emit('session:update', session);
    return { success: true };
  }

  @SubscribeMessage('session:nextRound')
  async handleNextRound(
    @ConnectedSocket() socket: Socket,
    @VisitorId() visitorId?: string,
  ): Promise<WSResponse> {
    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.handleNextRound(
      playerID,
      sessionID,
      visitorId,
    );
    this.enrichGame(session);

    this.io.to(session.id).emit('session:update', session);
    return { success: true };
  }

  @SubscribeMessage('session:playAgain')
  async playAgain(
    @ConnectedSocket() socket: Socket,
    @VisitorId() visitorId?: string,
  ): Promise<WSResponse> {
    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.startGame(
      playerID,
      sessionID,
      visitorId,
    );
    this.enrichGame(session);

    this.io.to(session.id).emit('session:update', session);

    return { success: true };
  }

  //////////////////////
  // Connection event //
  //////////////////////

  @SubscribeMessage('session:reconnect')
  async reconnect(
    @ConnectedSocket() socket: Socket,
    @CurrentUser() user: User | undefined,
    @MessageBody('sessionID') sessionID: string,
    @MessageBody('playerID') playerID: string,
  ): Promise<WSResponse & { isInGame?: boolean }> {
    if (!sessionID || !playerID) {
      throw new BadRequestException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'sessionID and playerID required.',
      });
    }

    this.wideEventService.enrich({ sessionId: sessionID, playerId: playerID });

    const session = await this.sessionService.reconnectPlayer(
      sessionID,
      playerID,
      user,
    );
    this.enrichGame(session);
    await this.connectionRegistryService.register(
      socket.id,
      playerID,
      sessionID,
      !user,
    );

    await socket.join(sessionID);
    this.io.to(sessionID).emit('session:update', session);

    return { success: true };
  }

  private async disconnect(socket: Socket): Promise<void> {
    try {
      const connection = await this.connectionRegistryService.getConnection(
        socket.id,
      );
      if (!connection) return;

      const session = await this.sessionService.disconnectPlayer(
        connection.playerID,
        connection.sessionID,
      );
      await this.connectionRegistryService.unregister(socket.id);

      await socket.leave(session.id);
      this.io.to(session.id).emit('session:update', session);

      this.logger.log(`Socket ${socket.id} déconnecté`);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : error);
    }
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    await this.disconnect(socket);
  }
}
