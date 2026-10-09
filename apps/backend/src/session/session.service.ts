import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  type CreateSession,
  defaultGameConfig,
  ErrorCode,
  type GameConfig,
  type Guess,
  type PlayerId,
  PlayerIdSchema,
  type Session,
  type SessionId,
  SessionIdSchema,
  SessionMode,
  type SessionPlayer,
  type SessionReconnectToken,
  SessionReconnectTokenSchema,
  SessionSchema,
  SessionStatus,
  type User,
} from '@cityborn/api';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventService } from '../event/event.service';
import { createEvent } from '../event/event.types';
import { GameService } from '../game/game.service';
import { IdService } from '../id/id.service';
import { LockService } from '../lock/lock.service';
import { RedisService } from '../redis/redis.service';
import {
  SESSION_PRESENCE_TIMING,
  type SessionPresenceTiming,
} from './session-presence-timing';

export type JoinedSession = {
  session: Session;
  reconnectToken: SessionReconnectToken | undefined;
};

@Injectable()
export class SessionService {
  private readonly prefix = 'session:';
  private readonly TTL = 30 * 60;
  private readonly LOCK_TTL = 2000;
  private readonly multiSessionExpirationsKey = 'multi-session-expirations';
  private readonly playerAbsenceStarts: Map<SessionId, Map<PlayerId, number>> =
    new Map();

  constructor(
    private readonly redisService: RedisService,
    private readonly lockService: LockService,
    private readonly idService: IdService,
    private readonly gameService: GameService,
    private readonly eventService: EventService,
    @Inject(SESSION_PRESENCE_TIMING)
    private readonly sessionPresenceTiming: SessionPresenceTiming,
  ) {}

  private getKey(id: SessionId): string {
    return `${this.prefix}${id}`;
  }

  private getReconnectTokenHashesKey(id: SessionId): string {
    return `${this.getKey(id)}:reconnect-token-hashes`;
  }

  ////////////////////
  // Session method //
  ////////////////////

  async create(
    dto: CreateSession,
    user?: User,
    visitorId?: string,
  ): Promise<Session> {
    const { mode } = dto;

    const sessionID: SessionId = await this.generateUniqueSessionID();
    const playerId = user?.username ?? PlayerIdSchema.parse('guest');

    const newSession: Session = {
      id: sessionID,
      hostID: mode === SessionMode.SOLO ? playerId : '',
      mode: mode,
      status: SessionStatus.IN_LOBBY,
      gameConfig: defaultGameConfig,
      players:
        mode === SessionMode.SOLO
          ? [
              {
                username: playerId,
                isGuest: !user,
                id: user ? user.id : undefined,
              },
            ]
          : [],
    };

    if (mode === SessionMode.MULTI) await this.saveSession(newSession);

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'session_created',
          visitorId,
          properties: {
            mode,
          },
        }),
      );
    }

    return newSession;
  }

  async getById(sessionID: SessionId): Promise<Session> {
    return await this.requireSession(sessionID);
  }

  async join(
    sessionID: SessionId,
    playerID: PlayerId,
    user?: User,
  ): Promise<JoinedSession> {
    return await this.updateSession(sessionID, async (session) => {
      if (session.currentGame)
        throw new ForbiddenException({
          code: ErrorCode.SESSION_ALREADY_IN_GAME,
          message: `Session already in game`,
        });

      const playerExists = session.players.some(
        (player) => player.username === playerID,
      );
      if (playerExists)
        throw new ConflictException({
          code: ErrorCode.SESSION_PLAYER_ALREADY_EXISTS,
          message: `Player already exists in session`,
        });

      const isGuest = !user;

      const newPlayer: SessionPlayer = {
        username: playerID,
        isGuest,
        id: isGuest ? undefined : user?.id,
        connected: true,
      };
      if (session.players.length === 0) session.hostID = playerID;
      session.players.push(newPlayer);

      if (session.hostID === '') session.hostID = playerID;

      const reconnectToken: SessionReconnectToken | undefined = isGuest
        ? await this.issueReconnectToken(sessionID, playerID)
        : undefined;
      return { session, reconnectToken };
    });
  }

  async updateHost(
    playerID: PlayerId,
    sessionID: SessionId,
    newHostID: PlayerId,
  ): Promise<Session> {
    return await this.updateSession(sessionID, async (session) => {
      if (session.currentGame)
        throw new ForbiddenException({
          code: ErrorCode.SESSION_ALREADY_IN_GAME,
          message: `Session already in game`,
        });

      if (session.hostID !== playerID)
        throw new ForbiddenException({
          code: ErrorCode.SESSION_FORBIDDEN_HOST,
          message: `Player is not the host`,
        });

      const newHost = session.players.find(
        (player) => player.username === newHostID && player.connected,
      );
      if (!newHost)
        throw new NotFoundException({
          code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
          message: `Player not found in session`,
        });

      session.hostID = newHost.username;
      return session;
    });
  }

  async updateGameConfig(
    playerID: PlayerId,
    sessionID: SessionId,
    gameConfig: GameConfig,
  ): Promise<Session> {
    return await this.updateSession(sessionID, async (session) => {
      if (session.currentGame)
        throw new ForbiddenException({
          code: ErrorCode.SESSION_ALREADY_IN_GAME,
          message: `Session already in game`,
        });

      if (session.hostID !== playerID)
        throw new ForbiddenException({
          code: ErrorCode.SESSION_FORBIDDEN_HOST,
          message: `Player is not the host`,
        });

      session.gameConfig = gameConfig;
      return session;
    });
  }

  async startGame(
    playerID: PlayerId,
    sessionID: SessionId,
    visitorId?: string,
  ): Promise<Session> {
    return await this.updateSession(sessionID, async (session) => {
      if (session.currentGame)
        throw new ForbiddenException({
          code: ErrorCode.SESSION_ALREADY_IN_GAME,
          message: `Session already in game`,
        });

      if (session.hostID !== playerID)
        throw new ForbiddenException({
          code: ErrorCode.SESSION_FORBIDDEN_HOST,
          message: `Player is not the host`,
        });

      const game = await this.gameService.createGame({
        gameConfig: session.gameConfig,
        players: session.players,
        mode: session.mode,
        visitorId,
      });

      session.status = SessionStatus.IN_GAME;
      session.currentGame = this.gameService.beginGame(game);
      return session;
    });
  }

  /////////////////////////
  // Current game method //
  /////////////////////////

  async handleGuess(
    playerID: PlayerId,
    sessionID: SessionId,
    guess: Guess,
  ): Promise<Session> {
    return await this.updateSession(sessionID, async (session) => {
      if (!session.currentGame)
        throw new NotFoundException({
          code: ErrorCode.SESSION_NO_CURRENT_GAME,
          message: `No current game in this session`,
        });
      const game = session.currentGame;

      const playerExists = session.players.some(
        (player) => player.username === playerID,
      );
      if (!playerExists)
        throw new NotFoundException({
          code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
          message: `Player not found in session`,
        });

      const playerConnected = session.players.some(
        (player) => player.username === playerID && player.connected,
      );
      if (!playerConnected)
        throw new UnauthorizedException({
          code: ErrorCode.SESSION_PLAYER_NOT_CONNECTED,
          message: `Player is not connected`,
        });

      if (!game.state.currentRound)
        throw new UnauthorizedException({
          code: ErrorCode.GAME_NO_ACTIVE_ROUND,
          message: `No active round on current game`,
        });

      const connectedPlayerUsernames = session.players
        .filter((player) => player.connected)
        .map((player) => player.username);

      session.currentGame = this.gameService.applyGuess(
        game,
        playerID,
        guess,
        connectedPlayerUsernames,
      );
      return session;
    });
  }

  async handleNextRound(
    playerID: PlayerId,
    sessionID: SessionId,
    visitorId?: string,
  ): Promise<Session> {
    return await this.updateSession(sessionID, async (session) => {
      if (!session.currentGame)
        throw new NotFoundException({
          code: ErrorCode.SESSION_NO_CURRENT_GAME,
          message: `No current game in this session`,
        });
      const game = session.currentGame;

      if (session.hostID !== playerID) {
        throw new UnauthorizedException({
          code: ErrorCode.SESSION_FORBIDDEN_HOST,
          message: `Player is not the host`,
        });
      }

      const { game: updatedGame, isGameOver } =
        this.gameService.resolveNextRound(game);

      if (!isGameOver) {
        session.currentGame = updatedGame;
        return session;
      }

      await this.gameService.endGame(
        updatedGame,
        session.players,
        session.mode,
        visitorId,
      );

      const finishedGameSession: Session = {
        ...session,
        currentGame: updatedGame,
      };
      session.status = SessionStatus.IN_LOBBY;
      session.currentGame = undefined;
      return finishedGameSession;
    });
  }

  ///////////////////////
  // Connection method //
  ///////////////////////

  async reconnectPlayer(
    sessionID: SessionId,
    playerID: PlayerId,
    reconnectToken: SessionReconnectToken | undefined,
    user?: User,
  ): Promise<Session> {
    return await this.updateSession(sessionID, async (session) => {
      const players = session.players;

      const playerIndex = players.findIndex(
        (player) => player.username === playerID,
      );
      if (playerIndex === -1)
        throw new NotFoundException({
          code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
          message: `Player not found in session`,
        });

      await this.assertReconnectingPlayerIdentity(
        sessionID,
        players[playerIndex],
        reconnectToken,
        user,
      );

      players[playerIndex].connected = true;

      if (session.hostID === '') session.hostID = playerID;

      return session;
    });
  }

  async listMultiSessionIDs(): Promise<SessionId[]> {
    await this.redisService.redisClient.zremrangebyscore(
      this.multiSessionExpirationsKey,
      '-inf',
      Date.now(),
    );
    const sessionIDs: string[] = await this.redisService.redisClient.zrange(
      this.multiSessionExpirationsKey,
      0,
      -1,
    );
    return sessionIDs.map((sessionID) => SessionIdSchema.parse(sessionID));
  }

  async reconcilePlayerPresence({
    sessionID,
    presentPlayerIDs,
  }: {
    sessionID: SessionId;
    presentPlayerIDs: PlayerId[];
  }): Promise<Session | null> {
    const storedSession: Session | null = await this.getSession(sessionID);
    if (!storedSession) {
      this.playerAbsenceStarts.delete(sessionID);
      return null;
    }

    const now: number = Date.now();
    const previousAbsenceStarts: Map<PlayerId, number> =
      this.playerAbsenceStarts.get(sessionID) ?? new Map();
    const absenceStarts: Map<PlayerId, number> = new Map(
      storedSession.players
        .filter(
          (player) =>
            player.connected && !presentPlayerIDs.includes(player.username),
        )
        .map((player) => [
          player.username,
          previousAbsenceStarts.get(player.username) ?? now,
        ]),
    );
    this.playerAbsenceStarts.set(sessionID, absenceStarts);

    const departedPlayerIDs: PlayerId[] = [...absenceStarts]
      .filter(
        ([, absenceStart]) =>
          now - absenceStart >=
          this.sessionPresenceTiming.disconnectGracePeriodMs,
      )
      .map(([playerID]) => playerID);
    const hasReturnedPlayer: boolean = storedSession.players.some(
      (player) =>
        !player.connected && presentPlayerIDs.includes(player.username),
    );
    if (departedPlayerIDs.length === 0 && !hasReturnedPlayer) return null;

    return await this.updateSession(sessionID, async (session) => {
      session.players.forEach((player) => {
        if (presentPlayerIDs.includes(player.username)) {
          player.connected = true;
          return;
        }
        if (!departedPlayerIDs.includes(player.username)) return;

        player.connected = false;
        this.reassignHostAfterRemoval(session, player.username);
      });
      if (session.hostID === '')
        session.hostID =
          session.players.find((player) => player.connected)?.username ?? '';
      return session;
    });
  }

  async kickPlayer(
    playerID: PlayerId,
    sessionID: SessionId,
    playerToKick: PlayerId,
  ): Promise<Session> {
    return await this.updateSession(sessionID, async (session) => {
      if (session.hostID !== playerID)
        throw new ForbiddenException({
          code: ErrorCode.SESSION_FORBIDDEN_HOST,
          message: `Player is not the host`,
        });

      if (session.currentGame)
        throw new ForbiddenException({
          code: ErrorCode.SESSION_ALREADY_IN_GAME,
          message: `Session already in game`,
        });

      const playerIndex = session.players.findIndex(
        (player) => player.username === playerToKick,
      );
      if (playerIndex === -1)
        throw new NotFoundException({
          code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
          message: `Player not found in session`,
        });

      session.players.splice(playerIndex, 1);

      this.reassignHostAfterRemoval(session, playerToKick);

      return session;
    });
  }

  ///////////
  // Store //
  ///////////

  private async updateSession<Result>(
    sessionID: SessionId,
    update: (session: Session) => Promise<Result>,
  ): Promise<Result> {
    return await this.lockService.withLock(
      this.getKey(sessionID),
      this.LOCK_TTL,
      async () => {
        const session: Session = await this.requireSession(sessionID);
        const result: Result = await update(session);
        await this.saveSession(session);
        return result;
      },
    );
  }

  private async requireSession(sessionID: SessionId): Promise<Session> {
    const session: Session | null = await this.getSession(sessionID);
    if (session) return session;

    throw new NotFoundException({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: `Session not found`,
    });
  }

  private async getSession(sessionID: SessionId): Promise<Session | null> {
    const storedSession = await this.redisService.getJSON<unknown>(
      this.getKey(sessionID),
    );
    if (!storedSession) return null;
    return SessionSchema.parse(storedSession);
  }

  private async saveSession(
    session: Session,
    ttl: number = this.TTL,
  ): Promise<void> {
    await Promise.all([
      this.redisService.setJSON(
        this.getKey(session.id),
        this.getLightSession(session),
        ttl,
      ),
      this.redisService.expire(
        this.getReconnectTokenHashesKey(session.id),
        ttl,
      ),
      this.redisService.redisClient.zadd(
        this.multiSessionExpirationsKey,
        Date.now() + ttl * 1000,
        session.id,
      ),
    ]);
  }

  private async issueReconnectToken(
    sessionID: SessionId,
    playerID: PlayerId,
  ): Promise<SessionReconnectToken> {
    const reconnectToken: SessionReconnectToken =
      SessionReconnectTokenSchema.parse(randomBytes(32).toString('base64url'));
    await this.redisService.hset(
      this.getReconnectTokenHashesKey(sessionID),
      playerID,
      this.hashReconnectToken(reconnectToken),
    );
    return reconnectToken;
  }

  private async isReconnectTokenValid(
    sessionID: SessionId,
    playerID: PlayerId,
    reconnectToken: SessionReconnectToken | undefined,
  ): Promise<boolean> {
    if (!reconnectToken) return false;

    const storedHash: string | null = await this.redisService.hget(
      this.getReconnectTokenHashesKey(sessionID),
      playerID,
    );
    if (!storedHash) return false;

    return timingSafeEqual(
      Buffer.from(storedHash, 'hex'),
      Buffer.from(this.hashReconnectToken(reconnectToken), 'hex'),
    );
  }

  private hashReconnectToken(reconnectToken: SessionReconnectToken): string {
    return createHash('sha256').update(reconnectToken).digest('hex');
  }

  //////////////////////
  // Private function //
  //////////////////////

  private async assertReconnectingPlayerIdentity(
    sessionID: SessionId,
    player: SessionPlayer,
    reconnectToken: SessionReconnectToken | undefined,
    user: User | undefined,
  ): Promise<void> {
    if (player.isGuest) {
      const reconnectTokenValid: boolean = await this.isReconnectTokenValid(
        sessionID,
        player.username,
        reconnectToken,
      );
      if (reconnectTokenValid) return;

      throw new ForbiddenException({
        code: ErrorCode.SESSION_RECONNECT_FORBIDDEN,
        message: 'Invalid or missing reconnect token',
      });
    }

    if (!user)
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_CREDENTIALS,
        message: 'Invalid or missing user token',
      });

    if (user.id !== player.id)
      throw new ForbiddenException({
        code: ErrorCode.SESSION_RECONNECT_FORBIDDEN,
        message: 'Authenticated user does not own this player',
      });
  }

  private reassignHostAfterRemoval(
    session: Session,
    removedPlayerID: PlayerId,
  ): void {
    if (session.hostID !== removedPlayerID) return;

    const connectedPlayers = session.players.filter(
      (player) => player.connected && player.username !== removedPlayerID,
    );
    session.hostID =
      connectedPlayers.length > 0 ? connectedPlayers[0].username : '';
  }

  private async generateUniqueSessionID(): Promise<SessionId> {
    const MAX_ATTEMPTS = 3;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const candidateId = SessionIdSchema.parse(
        this.idService.generateNanoId(),
      );
      if (!(await this.getSession(candidateId))) return candidateId;
    }

    throw new InternalServerErrorException({
      code: ErrorCode.SESSION_CREATION_FAILED,
      message: 'Max id generation attempt reached',
    });
  }

  private getLightSession(session: Session): Session {
    if (!session.currentGame) return session;

    return {
      ...session,
      currentGame: this.gameService.toLightGame(session.currentGame),
    };
  }
}
