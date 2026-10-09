import {
  ErrorCode,
  type PlayerId,
  type Session,
  type SessionId,
  type SessionJoinAck,
  sessionWsChannel,
  sessionWsServerEvent,
  type User,
  type VisitorId,
  type WsPayload,
  wsLifecycleEventName,
} from '@cityborn/api';
import {
  Inject,
  NotFoundException,
  type OnModuleDestroy,
  UseFilters,
} from '@nestjs/common';
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
import type {
  AppServer,
  AppSocket,
  SocketPlayer,
} from '../common/types/app-socket';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { WsWideEventLifecycle } from '../common/wide-event/ws-wide-event.lifecycle';
import { type JoinedSession, SessionService } from './session.service';
import {
  SESSION_PRESENCE_TIMING,
  type SessionPresenceTiming,
} from './session-presence-timing';

@WebSocketGateway()
@UseFilters(DefaultExceptionFilter)
export class SessionGateway
  implements OnGatewayInit, OnGatewayDisconnect, OnModuleDestroy
{
  private presenceReconciliationTimer: NodeJS.Timeout | undefined;

  constructor(
    private readonly sessionService: SessionService,
    private readonly wideEventService: WideEventService,
    private readonly wsWideEventLifecycle: WsWideEventLifecycle,
    @Inject(SESSION_PRESENCE_TIMING)
    private readonly sessionPresenceTiming: SessionPresenceTiming,
  ) {}

  @WebSocketServer()
  io!: AppServer;

  afterInit(): void {
    this.schedulePresenceReconciliation();
  }

  onModuleDestroy(): void {
    clearTimeout(this.presenceReconciliationTimer);
    this.presenceReconciliationTimer = undefined;
  }

  private resolvePlayer(socket: AppSocket): SocketPlayer {
    const { player } = socket.data;
    if (!player)
      throw new NotFoundException({
        code: ErrorCode.CONNECTION_NOT_FOUND,
        message: 'No connection associated with this socket',
      });

    this.wideEventService.enrichBusinessContext({
      sessionId: player.sessionID,
      playerId: player.playerID,
    });

    return player;
  }

  private async attachPlayer({
    socket,
    sessionID,
    playerID,
  }: {
    socket: AppSocket;
    sessionID: SessionId;
    playerID: PlayerId;
  }): Promise<void> {
    socket.data.player = { sessionID, playerID };
    await socket.join(sessionID);
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
      await this.sessionService.join(sessionID, playerID, user);
    await this.attachPlayer({ socket, sessionID, playerID });
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
    const { playerID, sessionID } = this.resolvePlayer(socket);
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
    const { playerID, sessionID } = this.resolvePlayer(socket);
    const session = await this.sessionService.updateGameConfig(
      playerID,
      sessionID,
      gameConfig,
    );
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
    const { playerID, sessionID } = this.resolvePlayer(socket);
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
    const { playerID, sessionID } = this.resolvePlayer(socket);
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
    const { playerID, sessionID } = this.resolvePlayer(socket);
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
    const { playerID, sessionID } = this.resolvePlayer(socket);
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

    const session = await this.sessionService.reconnectPlayer(
      sessionID,
      playerID,
      reconnectToken,
      user,
    );
    this.enrichGame(session);
    await this.attachPlayer({ socket, sessionID, playerID });
    this.broadcastSession(session);
  }

  private schedulePresenceReconciliation(): void {
    this.presenceReconciliationTimer = setTimeout(async () => {
      await this.reconcilePlayerPresence();
      if (this.presenceReconciliationTimer)
        this.schedulePresenceReconciliation();
    }, this.sessionPresenceTiming.reconciliationIntervalMs);
  }

  private async reconcilePlayerPresence(): Promise<void> {
    try {
      const presentPlayers: SocketPlayer[] = (
        await this.io.fetchSockets()
      ).flatMap(({ data }) => (data.player ? [data.player] : []));
      const sessionIDs: SessionId[] =
        await this.sessionService.listMultiSessionIDs();
      await Promise.all(
        sessionIDs.map((sessionID) =>
          this.reconcileSessionPresence({ sessionID, presentPlayers }),
        ),
      );
    } catch (error) {
      this.recordPresenceReconciliationError(error);
    }
  }

  private async reconcileSessionPresence({
    sessionID,
    presentPlayers,
  }: {
    sessionID: SessionId;
    presentPlayers: SocketPlayer[];
  }): Promise<void> {
    try {
      const session: Session | null =
        await this.sessionService.reconcilePlayerPresence({
          sessionID,
          presentPlayerIDs: presentPlayers
            .filter((player) => player.sessionID === sessionID)
            .map((player) => player.playerID),
        });
      if (session) this.broadcastSession(session);
    } catch (error) {
      this.recordPresenceReconciliationError(error);
    }
  }

  private recordPresenceReconciliationError(error: unknown): void {
    this.wideEventService.recordOperationError(error, {
      domain: 'session',
      operation: 'session.presence-reconciliation',
    });
  }

  async handleDisconnect(@ConnectedSocket() socket: AppSocket): Promise<void> {
    await this.wsWideEventLifecycle.runDisconnection(
      socket,
      wsLifecycleEventName(sessionWsChannel, 'disconnect'),
      async () => {
        const { player } = socket.data;
        if (!player) return;

        this.wideEventService.enrichBusinessContext({
          sessionId: player.sessionID,
          playerId: player.playerID,
        });
      },
    );
  }
}
