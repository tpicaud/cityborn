import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  type CreateSession,
  defaultGameConfig,
  defaultGuess,
  ErrorCode,
  type Game,
  type GameConfig,
  type GameId,
  type Guess,
  type GuessSubmission,
  type PlayerId,
  PlayerIdSchema,
  type PlayerResults,
  type Session,
  type SessionId,
  SessionIdSchema,
  SessionMode,
  type SessionPlayer,
  type SessionReconnectToken,
  SessionReconnectTokenSchema,
  SessionStatus,
  type User,
} from '@cityborn/api';
import { roundCountdownInSeconds } from '@cityborn/core';
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
import {
  SESSION_REPOSITORY,
  type SessionRepository,
  type StoredSession,
} from './repositories/session.repository';
import {
  SESSION_PRESENCE_TIMING,
  type SessionPresenceTiming,
} from './session-presence-timing';

export type JoinedSession = {
  session: Session;
  reconnectToken: SessionReconnectToken | undefined;
};

export type LeaveGameResult = {
  session: Session;
  gameId: GameId;
};

@Injectable()
export class SessionService {
  private readonly LOCK_TTL = 2000;
  private readonly ROUND_NETWORK_TOLERANCE_MS = 2000;
  private readonly playerAbsenceStarts: Map<SessionId, Map<PlayerId, number>> =
    new Map();

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly lockService: LockService,
    private readonly idService: IdService,
    private readonly gameService: GameService,
    private readonly eventService: EventService,
    @Inject(SESSION_PRESENCE_TIMING)
    private readonly sessionPresenceTiming: SessionPresenceTiming,
  ) {}

  private getLockResource(id: SessionId): string {
    return `session:${id}`;
  }

  ////////////////////
  // Session method //
  ////////////////////

  async create({
    mode,
    quickPlay = false,
    visitorId,
  }: CreateSession & { visitorId?: string }): Promise<Session> {
    const newSession: Session = {
      id: await this.generateUniqueSessionID(),
      hostID: '',
      mode: mode,
      status: SessionStatus.IN_LOBBY,
      quickPlay,
      gameConfig: defaultGameConfig,
      players: [],
    };

    await this.saveSession({
      session: newSession,
      reconnectTokenHashes: {},
      roundDeadline: null,
    });

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'session_created',
          visitorId,
          properties: {
            mode,
            quickPlay,
          },
        }),
      );
    }

    return newSession;
  }

  async getById(sessionID: SessionId): Promise<Session> {
    const { session }: StoredSession =
      await this.requireStoredSession(sessionID);
    return this.hideRoundGuesses(session);
  }

  async join(
    sessionID: SessionId,
    playerID: PlayerId,
    user?: User,
  ): Promise<JoinedSession> {
    return await this.updateSession(sessionID, async (storedSession) => {
      const { session }: StoredSession = storedSession;
      if (session.mode === SessionMode.SOLO && session.players.length > 0)
        throw new ForbiddenException({
          code: ErrorCode.SESSION_SOLO_NOT_JOINABLE,
          message: `Solo session already has its player`,
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
        ? this.issueReconnectToken({ storedSession, playerID })
        : undefined;
      return { session, reconnectToken };
    });
  }

  async updateHost(
    playerID: PlayerId,
    sessionID: SessionId,
    newHostID: PlayerId,
  ): Promise<Session> {
    return await this.updateSession(sessionID, async ({ session }) => {
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
    return await this.updateSession(sessionID, async ({ session }) => {
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
      session.quickPlay = false;
      return session;
    });
  }

  async startGame(
    playerID: PlayerId,
    sessionID: SessionId,
    visitorId?: string,
  ): Promise<Session> {
    return await this.updateSession(sessionID, async (storedSession) => {
      const { session }: StoredSession = storedSession;
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
        quickPlay: session.quickPlay ?? false,
        visitorId,
      });

      session.status = SessionStatus.IN_GAME;
      session.currentGame = this.gameService.beginGame(game);
      this.startRoundClock({ storedSession, timer: game.config.timer });
      return this.hideRoundGuesses(session);
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
    const isGuessWithoutClick: boolean =
      guess.distance === defaultGuess.distance;
    return await this.submitGuess({
      playerID,
      sessionID,
      guess: isGuessWithoutClick ? {} : { coordinates: guess.coordinates },
    });
  }

  async submitGuess({
    playerID,
    sessionID,
    guess,
  }: {
    playerID: PlayerId;
    sessionID: SessionId;
    guess: GuessSubmission;
  }): Promise<Session> {
    return await this.updateSession(sessionID, async (storedSession) => {
      const { session }: StoredSession = storedSession;
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

      const connectedPlayerIDs: PlayerId[] = session.players
        .filter((player) => player.connected)
        .map((player) => player.username);
      const isLate: boolean = this.isPastRoundDeadline(storedSession);

      session.currentGame = await this.gameService.applyGuess({
        game,
        playerID,
        coordinates: isLate ? undefined : guess.coordinates,
        connectedPlayerIDs,
      });
      return this.hideRoundGuesses(session);
    });
  }

  async handleNextRound(
    playerID: PlayerId,
    sessionID: SessionId,
    visitorId?: string,
  ): Promise<Session> {
    return await this.updateSession(sessionID, async (storedSession) => {
      const { session }: StoredSession = storedSession;
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
        this.startRoundClock({ storedSession, timer: game.config.timer });
        return this.hideRoundGuesses(session);
      }

      await this.gameService.endGame({
        game: updatedGame,
        players: session.players,
        mode: session.mode,
        quickPlay: session.quickPlay ?? false,
        visitorId,
      });

      const finishedGameSession: Session = {
        ...session,
        currentGame: updatedGame,
      };
      session.status = SessionStatus.IN_LOBBY;
      session.currentGame = undefined;
      return this.hideRoundGuesses(finishedGameSession);
    });
  }

  async leaveGame({
    playerID,
    sessionID,
    visitorId,
  }: {
    playerID: PlayerId;
    sessionID: SessionId;
    visitorId?: string;
  }): Promise<LeaveGameResult> {
    return await this.updateSession(sessionID, async (storedSession) => {
      const { session }: StoredSession = storedSession;
      if (!session.currentGame)
        throw new NotFoundException({
          code: ErrorCode.SESSION_NO_CURRENT_GAME,
          message: `No current game in this session`,
        });
      const game: Game = session.currentGame;

      const playerExists: boolean = session.players.some(
        (player) => player.username === playerID,
      );
      if (!playerExists)
        throw new NotFoundException({
          code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
          message: `Player not found in session`,
        });

      session.players = session.players.filter(
        (player) => player.username !== playerID,
      );
      this.reassignHostAfterRemoval(session, playerID);

      const remainingGame: Game = await this.gameService.abandonGame({
        game,
        playerID,
        connectedPlayerIDs: session.players
          .filter((player) => player.connected)
          .map((player) => player.username),
        mode: session.mode,
        quickPlay: session.quickPlay ?? false,
        visitorId,
      });
      delete storedSession.reconnectTokenHashes[playerID];

      if (session.players.length === 0) {
        session.status = SessionStatus.IN_LOBBY;
        session.currentGame = undefined;
        return { session, gameId: game.id };
      }

      session.currentGame = remainingGame;
      return { session: this.hideRoundGuesses(session), gameId: game.id };
    });
  }

  async createClientSoloGame({
    gameConfig,
    user,
    visitorId,
  }: {
    gameConfig: GameConfig;
    user?: User;
    visitorId?: string;
  }): Promise<Game> {
    return await this.gameService.createGame({
      gameConfig,
      players: [this.buildSoloPlayer(user)],
      mode: SessionMode.SOLO,
      quickPlay: false,
      visitorId,
    });
  }

  async finalizeClientSoloGame({
    game,
    user,
    visitorId,
  }: {
    game: Game;
    user?: User;
    visitorId?: string;
  }): Promise<void> {
    const soloPlayer: SessionPlayer = this.buildSoloPlayer(user);
    const soloPlayerResults: PlayerResults = game.state.results[
      soloPlayer.username
    ] ?? { results: [] };
    const soloGame: Game = {
      ...game,
      state: {
        ...game.state,
        results: { [soloPlayer.username]: soloPlayerResults },
      },
    };
    await this.gameService.endGame({
      game: soloGame,
      players: [soloPlayer],
      mode: SessionMode.SOLO,
      quickPlay: false,
      visitorId,
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
    return await this.updateSession(sessionID, async (storedSession) => {
      const { session }: StoredSession = storedSession;
      const players = session.players;

      const playerIndex = players.findIndex(
        (player) => player.username === playerID,
      );
      if (playerIndex === -1)
        throw new NotFoundException({
          code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
          message: `Player not found in session`,
        });

      this.assertReconnectingPlayerIdentity({
        storedSession,
        player: players[playerIndex],
        reconnectToken,
        user,
      });

      players[playerIndex].connected = true;

      if (session.hostID === '') session.hostID = playerID;

      return this.hideRoundGuesses(session);
    });
  }

  async pruneExpiredSessionsAndListIDs(): Promise<SessionId[]> {
    const sessionIDs: SessionId[] =
      await this.sessionRepository.listActiveIds();
    [...this.playerAbsenceStarts.keys()]
      .filter((sessionID) => !sessionIDs.includes(sessionID))
      .forEach((sessionID) => {
        this.playerAbsenceStarts.delete(sessionID);
      });
    return sessionIDs;
  }

  hasPlayerAbsence(): boolean {
    return [...this.playerAbsenceStarts.values()].some(
      (absenceStarts) => absenceStarts.size > 0,
    );
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

    return await this.updateSession(sessionID, async ({ session }) => {
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
      return this.hideRoundGuesses(session);
    });
  }

  ///////////
  // Store //
  ///////////

  private async updateSession<Result>(
    sessionID: SessionId,
    update: (storedSession: StoredSession) => Promise<Result>,
  ): Promise<Result> {
    return await this.lockService.withLock(
      this.getLockResource(sessionID),
      this.LOCK_TTL,
      async () => {
        const storedSession: StoredSession =
          await this.requireStoredSession(sessionID);
        const result: Result = await update(storedSession);
        await this.saveSession(storedSession);
        return result;
      },
    );
  }

  private hideRoundGuesses(session: Session): Session {
    if (!session.currentGame) return session;

    return {
      ...session,
      currentGame: this.gameService.hideGuessingRoundGuesses(
        session.currentGame,
      ),
    };
  }

  private async requireStoredSession(
    sessionID: SessionId,
  ): Promise<StoredSession> {
    const storedSession: StoredSession | null =
      await this.sessionRepository.find(sessionID);
    if (storedSession) return storedSession;

    throw new NotFoundException({
      code: ErrorCode.SESSION_NOT_FOUND,
      message: `Session not found`,
    });
  }

  private async getSession(sessionID: SessionId): Promise<Session | null> {
    const storedSession: StoredSession | null =
      await this.sessionRepository.find(sessionID);
    return storedSession?.session ?? null;
  }

  private async saveSession(storedSession: StoredSession): Promise<void> {
    await this.sessionRepository.save({
      ...storedSession,
      session: this.getLightSession(storedSession.session),
    });
  }

  private startRoundClock({
    storedSession,
    timer,
  }: {
    storedSession: StoredSession;
    timer: number;
  }): void {
    storedSession.roundDeadline =
      Date.now() +
      (roundCountdownInSeconds + timer) * 1000 +
      this.ROUND_NETWORK_TOLERANCE_MS;
  }

  private isPastRoundDeadline({ roundDeadline }: StoredSession): boolean {
    return roundDeadline !== null && Date.now() > roundDeadline;
  }

  private issueReconnectToken({
    storedSession,
    playerID,
  }: {
    storedSession: StoredSession;
    playerID: PlayerId;
  }): SessionReconnectToken {
    const reconnectToken: SessionReconnectToken =
      SessionReconnectTokenSchema.parse(randomBytes(32).toString('base64url'));
    storedSession.reconnectTokenHashes = {
      ...storedSession.reconnectTokenHashes,
      [playerID]: this.hashReconnectToken(reconnectToken),
    };
    return reconnectToken;
  }

  private isReconnectTokenValid({
    storedSession,
    playerID,
    reconnectToken,
  }: {
    storedSession: StoredSession;
    playerID: PlayerId;
    reconnectToken: SessionReconnectToken | undefined;
  }): boolean {
    if (!reconnectToken) return false;

    const storedHash: string | undefined =
      storedSession.reconnectTokenHashes[playerID];
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

  private assertReconnectingPlayerIdentity({
    storedSession,
    player,
    reconnectToken,
    user,
  }: {
    storedSession: StoredSession;
    player: SessionPlayer;
    reconnectToken: SessionReconnectToken | undefined;
    user: User | undefined;
  }): void {
    if (player.isGuest) {
      const reconnectTokenValid: boolean = this.isReconnectTokenValid({
        storedSession,
        playerID: player.username,
        reconnectToken,
      });
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

  private buildSoloPlayer(user?: User): SessionPlayer {
    return {
      username: user?.username ?? PlayerIdSchema.parse('guest'),
      isGuest: !user,
      id: user?.id,
    };
  }

  private async generateUniqueSessionID(
    remainingAttempts: number = 3,
  ): Promise<SessionId> {
    if (remainingAttempts === 0) {
      throw new InternalServerErrorException({
        code: ErrorCode.SESSION_CREATION_FAILED,
        message: 'Max id generation attempt reached',
      });
    }

    const candidateId: SessionId = SessionIdSchema.parse(
      this.idService.generateNanoId(),
    );
    if (!(await this.getSession(candidateId))) return candidateId;
    return this.generateUniqueSessionID(remainingAttempts - 1);
  }

  private getLightSession(session: Session): Session {
    if (!session.currentGame) return session;

    return {
      ...session,
      currentGame: this.gameService.toLightGame(session.currentGame),
    };
  }
}
