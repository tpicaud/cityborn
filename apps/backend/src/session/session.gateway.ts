import {
  ErrorCode,
  type Session,
  type SessionJoinAck,
  sessionWsChannel,
  sessionWsServerEvent,
  type User,
  type VisitorId,
  type WsPayload,
  wsLifecycleEventName,
} from '@cityborn/api';
import { NotFoundException, UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { CurrentUser } from '../auth/current-auth-session.decorator';
import { VisitorId as CurrentVisitorId } from '../common/decorators/visitor-id.decorator';
import { WsMessage } from '../common/decorators/ws-message.decorator';
import { DefaultExceptionFilter } from '../common/filters/default-exception.filter';
import type { AppServer, AppSocket } from '../common/types/app-socket';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { WsWideEventLifecycle } from '../common/wide-event/ws-wide-event.lifecycle';
import {
  type ConnectionInfo,
  ConnectionRegistryService,
  type PlayerPresence,
} from '../connection-registry/connection-registry.service';
import { type JoinedSession, SessionService } from './session.service';

@WebSocketGateway()
@UseFilters(DefaultExceptionFilter)
export class SessionGateway implements OnGatewayInit, OnGatewayDisconnect {
  constructor(
    private readonly sessionService: SessionService,
    private readonly connectionRegistryService: ConnectionRegistryService,
    private readonly wideEventService: WideEventService,
    private readonly wsWideEventLifecycle: WsWideEventLifecycle,
  ) {}

  @WebSocketServer()
  io!: AppServer;

  afterInit(): void {
    this.connectionRegistryService.onPresenceExpired((presence) =>
      this.disconnectAbsentPlayer(presence),
    );
  }

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

  ///////////////////
  // Session event //
  ///////////////////

  @WsMessage(sessionWsChannel, 'join')
  async handleJoin(
    @ConnectedSocket() socket: AppSocket,
    @CurrentUser() user: User | undefined,
    @MessageBody() {
      sessionID,
      playerID,
    }: WsPayload<typeof sessionWsChannel, 'join'>,
  ): Promise<SessionJoinAck> {
    this.wideEventService.enrichBusinessContext({
      sessionId: sessionID,
      playerId: playerID,
    });

    const { session, reconnectToken }: JoinedSession =
      await this.sessionService.join({
        sessionID,
        playerID,
        user,
        socketID: socket.id,
      });

    await socket.join(session.id);
    this.broadcastSession(session);
    return { reconnectToken };
  }

  @WsMessage(sessionWsChannel, 'updateHost')
  async updateHost(
    @ConnectedSocket() socket: AppSocket,
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
    @ConnectedSocket() socket: AppSocket,
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
    @ConnectedSocket() socket: AppSocket,
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
    @ConnectedSocket() socket: AppSocket,
    @CurrentVisitorId() visitorId: VisitorId | undefined,
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
    @ConnectedSocket() socket: AppSocket,
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
    @ConnectedSocket() socket: AppSocket,
    @CurrentVisitorId() visitorId: VisitorId | undefined,
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
    @ConnectedSocket() socket: AppSocket,
    @CurrentVisitorId() visitorId: VisitorId | undefined,
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
    @ConnectedSocket() socket: AppSocket,
    @CurrentUser() user: User | undefined,
    @MessageBody() {
      sessionID,
      playerID,
      reconnectToken,
    }: WsPayload<typeof sessionWsChannel, 'reconnect'>,
  ): Promise<void> {
    this.wideEventService.enrichBusinessContext({
      sessionId: sessionID,
      playerId: playerID,
    });

    const session: Session = await this.sessionService.reconnectPlayer({
      sessionID,
      playerID,
      reconnectToken,
      user,
      socketID: socket.id,
    });
    this.enrichGame(session);

    await socket.join(sessionID);
    this.broadcastSession(session);
  }

  private async disconnect(socket: AppSocket): Promise<void> {
    try {
      const connection: ConnectionInfo | null =
        await this.connectionRegistryService.release(socket.id);
      if (!connection) return;

      this.wideEventService.enrichBusinessContext({
        sessionId: connection.sessionID,
        playerId: connection.playerID,
      });
    } catch (error) {
      this.wideEventService.recordError(error, 'ws.disconnect');
    }
  }

  private async disconnectAbsentPlayer(
    presence: PlayerPresence,
  ): Promise<void> {
    const session: Session | null =
      await this.sessionService.disconnectAbsentPlayer(presence);
    if (session) this.broadcastSession(session);
  }

  async handleDisconnect(@ConnectedSocket() socket: AppSocket): Promise<void> {
    await this.wsWideEventLifecycle.runDisconnection(
      socket,
      wsLifecycleEventName(sessionWsChannel, 'disconnect'),
      () => this.disconnect(socket),
    );
  }
}
