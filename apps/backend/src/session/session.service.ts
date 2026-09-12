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
  SessionSchema,
  SessionStatus,
  type User,
} from '@cityborn/api';
import {
  ConflictException,
  ForbiddenException,
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

@Injectable()
export class SessionService {
  private readonly prefix = 'session:';
  private readonly TTL = 30 * 60;
  private readonly LOCK_TTL = 2000;

  constructor(
    private readonly redisService: RedisService,
    private readonly lockService: LockService,
    private readonly idService: IdService,
    private readonly gameService: GameService,
    private readonly eventService: EventService,
  ) {}

  private getKey(id: SessionId): string {
    return `${this.prefix}${id}`;
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
    const session = await this.getSession(sessionID);

    if (!session) {
      throw new NotFoundException({
        code: ErrorCode.SESSION_NOT_FOUND,
        message: `Session not found.`,
      });
    }

    return session;
  }

  async join(sessionID: SessionId, playerID: PlayerId, user?: User) {
    return await this.lockService.withLock(
      this.getKey(sessionID),
      this.LOCK_TTL,
      async () => {
        const session: Session | null = await this.getSession(sessionID);
        if (!session)
          throw new NotFoundException({
            code: ErrorCode.SESSION_NOT_FOUND,
            message: `Session not found`,
          });

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

        const newPlayer: Session['players'][number] = {
          username: playerID,
          isGuest,
          id: isGuest ? undefined : user?.id,
          connected: true,
        };
        if (session.players.length === 0) session.hostID = playerID;
        session.players.push(newPlayer);

        if (session.hostID === '') session.hostID = playerID;

        await this.saveSession(session);
        return session;
      },
    );
  }

  async updateHost(
    playerID: PlayerId,
    sessionID: SessionId,
    newHostID: PlayerId,
  ) {
    const session: Session | null = await this.getSession(sessionID);
    if (!session)
      throw new NotFoundException({
        code: ErrorCode.SESSION_NOT_FOUND,
        message: `Session not found`,
      });

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

    await this.saveSession(session);
    return session;
  }

  async updateGameConfig(
    playerID: PlayerId,
    sessionID: SessionId,
    gameConfig: GameConfig,
  ) {
    const session: Session | null = await this.getSession(sessionID);
    if (!session)
      throw new NotFoundException({
        code: ErrorCode.SESSION_NOT_FOUND,
        message: `Session not found`,
      });

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

    await this.saveSession(session);
    return session;
  }

  async startGame(
    playerID: PlayerId,
    sessionID: SessionId,
    visitorId?: string,
  ) {
    const session: Session | null = await this.getSession(sessionID);
    if (!session)
      throw new NotFoundException({
        code: ErrorCode.SESSION_NOT_FOUND,
        message: `Session not found`,
      });

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

    await this.saveSession(this.getLightSession(session));
    return session;
  }

  /////////////////////////
  // Current game method //
  /////////////////////////

  async handleGuess(playerID: PlayerId, sessionID: SessionId, guess: Guess) {
    return await this.lockService.withLock(
      this.getKey(sessionID),
      this.LOCK_TTL,
      async () => {
        const session = await this.getSession(sessionID);
        if (!session)
          throw new NotFoundException({
            code: ErrorCode.SESSION_NOT_FOUND,
            message: `Session not found`,
          });

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

        const updatedGame = this.gameService.applyGuess(
          game,
          playerID,
          guess,
          connectedPlayerUsernames,
        );
        if (updatedGame !== game) {
          session.currentGame = updatedGame;
          await this.saveSession(session);
        }
        return session;
      },
    );
  }

  async handleNextRound(
    playerID: PlayerId,
    sessionID: SessionId,
    visitorId?: string,
  ) {
    return await this.lockService.withLock(
      this.getKey(sessionID),
      this.LOCK_TTL,
      async () => {
        const session = await this.getSession(sessionID);
        if (!session)
          throw new NotFoundException({
            code: ErrorCode.SESSION_NOT_FOUND,
            message: `Session not found`,
          });

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

        if (isGameOver) {
          await this.gameService.endGame(
            updatedGame,
            session.players,
            session.mode,
            visitorId,
          );

          const lobbySession: Session = {
            ...session,
            status: SessionStatus.IN_LOBBY,
            currentGame: undefined,
          };
          await this.saveSession(lobbySession);

          session.currentGame = updatedGame;
        } else {
          session.currentGame = updatedGame;
          await this.saveSession(session);
        }

        return session;
      },
    );
  }

  ///////////////////////
  // Connection method //
  ///////////////////////

  async reconnectPlayer(sessionID: SessionId, playerID: PlayerId, user?: User) {
    return await this.lockService.withLock(
      this.getKey(sessionID),
      this.LOCK_TTL,
      async () => {
        const session: Session | null = await this.getSession(sessionID);
        if (!session)
          throw new NotFoundException({
            code: ErrorCode.SESSION_NOT_FOUND,
            message: `Session not found`,
          });

        const players = session.players;

        const playerIndex = players.findIndex(
          (player) => player.username === playerID,
        );
        if (playerIndex === -1)
          throw new NotFoundException({
            code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
            message: `Player not found in session`,
          });

        const player = players[playerIndex];
        if (!user && !player.isGuest)
          throw new UnauthorizedException({
            code: ErrorCode.USER_INVALID_CREDENTIALS,
            message: 'Invalid or missing user token',
          });

        players[playerIndex].connected = true;

        if (session.hostID === '') session.hostID = playerID;

        await this.saveSession(session);
        return session;
      },
    );
  }

  async disconnectPlayer(
    playerID: PlayerId,
    sessionID: SessionId,
  ): Promise<Session> {
    return await this.lockService.withLock(
      this.getKey(sessionID),
      this.LOCK_TTL,
      async () => {
        const session: Session | null = await this.getSession(sessionID);
        if (!session)
          throw new NotFoundException({
            code: ErrorCode.SESSION_NOT_FOUND,
            message: `Session not found`,
          });

        const playerIndex = session.players.findIndex(
          (player) => player.username === playerID,
        );
        if (playerIndex === -1)
          throw new NotFoundException({
            code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
            message: `Player not found in session`,
          });

        session.players[playerIndex].connected = false;

        this.reassignHostAfterRemoval(session, playerID);

        await this.saveSession(session);

        return session;
      },
    );
  }

  async kickPlayer(
    playerID: PlayerId,
    sessionID: SessionId,
    playerToKick: PlayerId,
  ): Promise<Session> {
    return await this.lockService.withLock(
      this.getKey(sessionID),
      this.LOCK_TTL,
      async () => {
        const session: Session | null = await this.getSession(sessionID);
        if (!session)
          throw new NotFoundException({
            code: ErrorCode.SESSION_NOT_FOUND,
            message: `Session not found`,
          });

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

        await this.saveSession(session);

        return session;
      },
    );
  }

  ///////////
  // Store //
  ///////////

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
    await this.redisService.setJSON(this.getKey(session.id), session, ttl);
  }

  //////////////////////
  // Private function //
  //////////////////////

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
