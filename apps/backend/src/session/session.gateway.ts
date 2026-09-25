import {
  ErrorCode,
  type Session,
  sessionWsChannel,
  sessionWsServerEvent,
  type User,
  WS_ERROR_EVENT,
  type WsLifecycleEventName,
  type WsPayload,
  wsLifecycleEventName,
} from '@cityborn/api';
import {
  Inject,
  NotFoundException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { resolveFullUser, validateAccessToken } from '../auth/guards/utils';
import { WsSessionGuard } from '../auth/guards/ws-session.guard';
import {
  SessionRevocationService,
  userSessionRoom,
} from '../auth/services/session-revocation.service';
import { extractAccessTokenFromWsClient } from '../auth/utils';
import { VisitorId } from '../common/decorators/visitor-id.decorator';
import { WsMessage } from '../common/decorators/ws-message.decorator';
import { DefaultExceptionFilter } from '../common/filters/default-exception.filter';
import type {
  SessionServer,
  SessionSocket,
} from '../common/types/session-socket';
import {
  createWsWideEvent,
  firstHeaderValue,
} from '../common/wide-event/wide-event';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { backendConfig } from '../config/backend.config';
import { AUTH_CONFIG, type AuthConfig } from '../config/config.module';
import {
  type ConnectionInfo,
  ConnectionRegistryService,
} from '../connection-registry/connection-registry.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { resolveClientIpFromHeaders } from '../rate-limit/resolve-client-ip';
import { CurrentUser } from '../user/user.decorator';
import { UserService } from '../user/user.service';
import { SessionService } from './session.service';

@WebSocketGateway({
  cors: {
    origin: backendConfig.http.corsOrigins,
    credentials: true,
  },
})
@UseFilters(DefaultExceptionFilter)
@UseGuards(WsSessionGuard)
export class SessionGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private readonly sessionService: SessionService,
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly connectionRegistryService: ConnectionRegistryService,
    private readonly rateLimitService: RateLimitService,
    private readonly wideEventService: WideEventService,
    private readonly sessionRevocationService: SessionRevocationService,
  ) {}

  afterInit(server: SessionServer): void {
    this.sessionRevocationService.registerServer(server);
  }

  @WebSocketServer()
  io!: SessionServer;

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

  private broadcastSession(session: Session): void {
    this.io.to(session.id).emit(sessionWsServerEvent.update, session);
  }

  private enrichGame(session: Session): void {
    if (session.currentGame) {
      this.wideEventService.enrichBusinessContext({
        gameId: session.currentGame.id,
      });
    }
  }

  async handleConnection(client: SessionSocket): Promise<void> {
    const authentication: Promise<void> = this.runConnectionWideEvent(
      client,
      'connection',
      wsLifecycleEventName(sessionWsChannel, 'connect'),
      () => this.connect(client),
    );
    client.use((_packet, next) => {
      void authentication
        .then(() => {
          if (!client.connected) {
            next(new Error('Connection closed'));
            return;
          }
          next();
        })
        .catch(() => next(new Error('Authentication failed')));
    });
    await authentication;
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
      client.emit(WS_ERROR_EVENT, apiError);
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
      this.authConfig.jwtAccessSecret,
    ).catch((error: unknown) => {
      this.wideEventService.recordError(error, 'ws.connection_token');
      return null;
    });

    if (!payload) {
      client.disconnect(true);
      return;
    }

    try {
      client.data.sessionVersion = payload.sessionVersion;
      await client.join(userSessionRoom(payload.id));
      client.data.user = await resolveFullUser(
        payload.id,
        this.userService,
        payload.sessionVersion,
      );
      if (!client.data.user) client.disconnect(true);
    } catch (error) {
      this.wideEventService.recordError(error, 'ws.connection_auth');
      client.data.user = undefined;
      client.disconnect(true);
    }
  }

  ///////////////////
  // Session event //
  ///////////////////

  @WsMessage(sessionWsChannel, 'join')
  async handleJoin(
    @ConnectedSocket() socket: SessionSocket,
    @CurrentUser() user: User | undefined,
    @MessageBody() {
      sessionID,
      playerID,
    }: WsPayload<typeof sessionWsChannel, 'join'>,
  ): Promise<void> {
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
    this.broadcastSession(session);
  }

  @WsMessage(sessionWsChannel, 'updateHost')
  async updateHost(
    @ConnectedSocket() socket: SessionSocket,
    @MessageBody() {
      newHostID,
    }: WsPayload<typeof sessionWsChannel, 'updateHost'>,
  ): Promise<void> {
    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.updateHost(
      playerID,
      sessionID,
      newHostID,
    );
    this.broadcastSession(session);
  }

  @WsMessage(sessionWsChannel, 'updateGameConfig')
  async updateGameConfig(
    @ConnectedSocket() socket: SessionSocket,
    @MessageBody() {
      gameConfig,
    }: WsPayload<typeof sessionWsChannel, 'updateGameConfig'>,
  ): Promise<void> {
    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.updateGameConfig(
      playerID,
      sessionID,
      gameConfig,
    );
    this.broadcastSession(session);
  }

  @WsMessage(sessionWsChannel, 'kickPlayer')
  async kickPlayer(
    @ConnectedSocket() socket: SessionSocket,
    @MessageBody() {
      playerToKick,
    }: WsPayload<typeof sessionWsChannel, 'kickPlayer'>,
  ): Promise<void> {
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
        remoteSocket.leave(sessionID);
        await this.connectionRegistryService.unregister(remoteSocket.id);
      }
    }

    this.broadcastSession(session);
  }

  ////////////////////////
  // Current game event //
  ////////////////////////

  @WsMessage(sessionWsChannel, 'startGame')
  async startGame(
    @ConnectedSocket() socket: SessionSocket,
    @VisitorId() visitorId?: string,
  ): Promise<void> {
    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.startGame(
      playerID,
      sessionID,
      visitorId,
    );
    this.enrichGame(session);
    this.broadcastSession(session);
  }

  @WsMessage(sessionWsChannel, 'guess')
  async handleGuess(
    @ConnectedSocket() socket: SessionSocket,
    @MessageBody() { guess }: WsPayload<typeof sessionWsChannel, 'guess'>,
  ): Promise<void> {
    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.handleGuess(
      playerID,
      sessionID,
      guess,
    );
    this.enrichGame(session);
    this.broadcastSession(session);
  }

  @WsMessage(sessionWsChannel, 'nextRound')
  async handleNextRound(
    @ConnectedSocket() socket: SessionSocket,
    @VisitorId() visitorId?: string,
  ): Promise<void> {
    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.handleNextRound(
      playerID,
      sessionID,
      visitorId,
    );
    this.enrichGame(session);
    this.broadcastSession(session);
  }

  @WsMessage(sessionWsChannel, 'playAgain')
  async playAgain(
    @ConnectedSocket() socket: SessionSocket,
    @VisitorId() visitorId?: string,
  ): Promise<void> {
    const { playerID, sessionID } = await this.resolveConnection(socket.id);
    const session = await this.sessionService.startGame(
      playerID,
      sessionID,
      visitorId,
    );
    this.enrichGame(session);
    this.broadcastSession(session);
  }

  //////////////////////
  // Connection event //
  //////////////////////

  @WsMessage(sessionWsChannel, 'reconnect')
  async reconnect(
    @ConnectedSocket() socket: SessionSocket,
    @CurrentUser() user: User | undefined,
    @MessageBody() {
      sessionID,
      playerID,
    }: WsPayload<typeof sessionWsChannel, 'reconnect'>,
  ): Promise<void> {
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
    this.broadcastSession(session);
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
      this.broadcastSession(session);
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
      wsLifecycleEventName(sessionWsChannel, 'disconnect'),
      () => this.disconnect(socket),
    );
  }

  private async runConnectionWideEvent(
    socket: SessionSocket,
    kind: 'connection' | 'disconnection',
    eventName: WsLifecycleEventName,
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
