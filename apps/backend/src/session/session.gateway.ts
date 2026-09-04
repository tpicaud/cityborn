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
  NotFoundException,
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
import { DefaultExceptionFilter } from '../common/filters/default-exception.filter';
import type { SessionSocket } from '../common/types/session-socket';
import {
  createWsWideEvent,
  firstHeaderValue,
} from '../common/wide-event/wide-event';
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
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
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

    this.wideEventService.enrichBusinessContext({
      sessionId: connection.sessionID,
      playerId: connection.playerID,
    });

    return connection;
  }

  private enrichGame(session: Session): void {
    if (session.currentGame) {
      this.wideEventService.enrichBusinessContext({
        gameId: session.currentGame.id,
      });
    }
  }

  async handleConnection(client: SessionSocket): Promise<void> {
    await this.runConnectionWideEvent(
      client,
      'connection',
      'session:connect',
      () => this.connect(client),
    );
  }

  private async connect(client: SessionSocket): Promise<void> {
    try {
      await this.rateLimitService.consumeWsConnection(
        resolveClientIpFromHeaders(
          client.handshake.headers,
          client.handshake.address,
        ),
      );
    } catch (error) {
      const apiError = this.wideEventService.recordError(
        error,
        'ws.connection',
      );
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
    ).catch((error: unknown) => {
      this.wideEventService.recordError(error, 'ws.connection_token');
      return null;
    });

    if (!payload) return;

    try {
      client.data.user = await resolveFullUser(payload.id, this.userService);
    } catch (error) {
      this.wideEventService.recordError(error, 'ws.connection_auth');
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
        code: ErrorCode.BAD_REQUEST,
        message: 'sessionID et playerID required.',
      });
    }

    this.wideEventService.enrichBusinessContext({
      sessionId: sessionID,
      playerId: playerID,
    });

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
        code: ErrorCode.BAD_REQUEST,
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
        code: ErrorCode.BAD_REQUEST,
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
        code: ErrorCode.BAD_REQUEST,
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
        code: ErrorCode.BAD_REQUEST,
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
        code: ErrorCode.BAD_REQUEST,
        message: 'sessionID and playerID required.',
      });
    }

    this.wideEventService.enrichBusinessContext({
      sessionId: sessionID,
      playerId: playerID,
    });

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

  private async disconnect(socket: SessionSocket): Promise<void> {
    try {
      const connection = await this.connectionRegistryService.getConnection(
        socket.id,
      );
      if (!connection) return;

      this.wideEventService.enrichBusinessContext({
        sessionId: connection.sessionID,
        playerId: connection.playerID,
      });

      const session = await this.sessionService.disconnectPlayer(
        connection.playerID,
        connection.sessionID,
      );
      await this.connectionRegistryService.unregister(socket.id);

      await socket.leave(session.id);
      this.io.to(session.id).emit('session:update', session);
      this.enrichGame(session);
    } catch (error) {
      this.wideEventService.recordError(error, 'ws.disconnect');
    }
  }

  async handleDisconnect(
    @ConnectedSocket() socket: SessionSocket,
  ): Promise<void> {
    await this.runConnectionWideEvent(
      socket,
      'disconnection',
      'session:disconnect',
      () => this.disconnect(socket),
    );
  }

  private async runConnectionWideEvent(
    socket: SessionSocket,
    kind: 'connection' | 'disconnection',
    eventName: string,
    handler: () => Promise<void>,
  ): Promise<void> {
    const headers = socket.handshake.headers;
    return this.wideEventService.run(
      createWsWideEvent({
        kind,
        eventName,
        socketId: socket.id,
        ip: resolveClientIpFromHeaders(headers, socket.handshake.address),
        userAgent: headers['user-agent'],
        visitorId: firstHeaderValue(socket.handshake.query['x-visitor-id']),
        client: firstHeaderValue(headers['x-client-name']),
        clientVersion: firstHeaderValue(headers['x-client-version']),
      }),
      async () => {
        try {
          await handler();
        } finally {
          const user = socket.data.user;
          this.wideEventService.enrichAuth(
            user
              ? { isAuthenticated: true, userId: user.id }
              : { isAuthenticated: false },
          );
          this.wideEventService.finish();
        }
      },
    );
  }
}
