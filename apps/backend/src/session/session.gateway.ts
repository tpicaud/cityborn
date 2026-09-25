import {
  ErrorCode,
  type Session,
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
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { VisitorId as CurrentVisitorId } from '../common/decorators/visitor-id.decorator';
import { WsMessage } from '../common/decorators/ws-message.decorator';
import { DefaultExceptionFilter } from '../common/filters/default-exception.filter';
import type {
  SessionServer,
  SessionSocket,
} from '../common/types/session-socket';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { WsWideEventLifecycle } from '../common/wide-event/ws-wide-event.lifecycle';
import {
  type ConnectionInfo,
  ConnectionRegistryService,
} from '../connection-registry/connection-registry.service';
import { CurrentUser } from '../user/user.decorator';
import { SessionService } from './session.service';

@WebSocketGateway()
@UseFilters(DefaultExceptionFilter)
export class SessionGateway implements OnGatewayDisconnect {
  constructor(
    private readonly sessionService: SessionService,
    private readonly connectionRegistryService: ConnectionRegistryService,
    private readonly wideEventService: WideEventService,
    private readonly wsWideEventLifecycle: WsWideEventLifecycle,
  ) {}

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
    @ConnectedSocket() socket: SessionSocket,
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
    await this.wsWideEventLifecycle.runConnectionLifecycle(
      socket,
      'disconnection',
      wsLifecycleEventName(sessionWsChannel, 'disconnect'),
      () => this.disconnect(socket),
    );
  }
}
