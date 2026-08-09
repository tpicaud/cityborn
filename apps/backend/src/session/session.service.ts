import {
  type CreateSession,
  defaultGameConfig,
  defaultGuess,
  ErrorCode,
  FullGuessObject,
  type Game,
  type GameConfig,
  GameStatus,
  type Guess,
  type OnlinePlayer,
  type PlayerResults,
  type Round,
  RoundStatus,
  type Session,
  SessionMode,
  SessionStatus,
  type User,
} from '@cityborn/api';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventService } from '../event/event.service';
import { createEvent } from '../event/event.types';
import { GuessObjectService } from '../guess-object/guess-object.service';
import { IdService } from '../id/id.service';
import { LockService } from '../lock/lock.service';
import { PlayerService } from '../player/player.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SessionService {
  private readonly prefix = 'session:';
  private readonly TTL = 30 * 60;
  private readonly LOCK_TTL = 2000;
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly lockService: LockService,
    private readonly playerService: PlayerService,
    private readonly idService: IdService,
    private readonly guessObjectService: GuessObjectService,
    private readonly prisma: PrismaService,
    private readonly eventService: EventService,
  ) {}

  private getKey(id: string): string {
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

    const sessionID: string = await this.generateUniqueSessionID();

    const newSession: Session = {
      id: sessionID,
      hostID: mode === SessionMode.SOLO ? (user ? user.username : 'guest') : '',
      mode: mode,
      status: SessionStatus.IN_LOBBY,
      gameConfig: defaultGameConfig,
      players:
        mode === SessionMode.SOLO
          ? [
              {
                username: user ? user.username : 'guest',
                isGuest: !user,
                id: user ? user.id : undefined,
              },
            ]
          : [],
    };

    this.logger.log('saving solo session');
    if (mode === SessionMode.MULTI) await this.saveSession(newSession);

    this.logger.log('saving solo session');
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

  async getById(sessionID: string): Promise<Session> {
    const session = await this.getSession(sessionID);

    if (!session) {
      throw new NotFoundException({
        code: ErrorCode.SESSION_NOT_FOUND,
        message: `Session not found.`,
      });
    }

    return session;
  }

  async join(
    socketID: string,
    sessionID: string,
    playerID: string,
    user?: User,
  ) {
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
        await this.playerService.save(socketID, playerID, sessionID, isGuest);

        const newPlayer: OnlinePlayer = {
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

  async updateHost(socketID: string, newHostID: string) {
    const player = await this.playerService.getPlayer(socketID);
    if (!player)
      throw new NotFoundException({
        code: ErrorCode.PLAYER_NOT_FOUND,
        message: `No player associated with this socket`,
      });

    const { playerID, sessionID } = player;

    const session: Session | null = await this.getSession(sessionID);
    if (!session)
      throw new NotFoundException({
        code: ErrorCode.SESSION_NOT_FOUND,
        message: `Session not found`,
      });

    if (session.status === 'IN_GAME')
      throw new BadRequestException({
        code: ErrorCode.SESSION_ALREADY_IN_GAME,
        message: `Session is already in game`,
      });

    if (session.hostID !== playerID)
      throw new ForbiddenException({
        code: ErrorCode.SESSION_FORBIDDEN_HOST,
        message: `Player is not the host`,
      });

    const newHost = (session.players as OnlinePlayer[]).find(
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

  async updateGameConfig(socketID: string, gameConfig: GameConfig) {
    const player = await this.playerService.getPlayer(socketID);
    if (!player)
      throw new NotFoundException({
        code: ErrorCode.PLAYER_NOT_FOUND,
        message: `No player associated with this socket`,
      });

    const { playerID, sessionID } = player;

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

  async startGame(socketID: string, visitorId?: string) {
    const player = await this.playerService.getPlayer(socketID);
    if (!player)
      throw new NotFoundException({
        code: ErrorCode.PLAYER_NOT_FOUND,
        message: `No player associated with this socket`,
      });

    const { playerID, sessionID } = player;

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

    const game = await this.createGame(session, visitorId);

    const firstRound: Round = {
      status: RoundStatus.GUESSING,
      guessObjectId: game.state.guessObjectsIds[0],
      playersGuesses: {},
    };
    game.status = GameStatus.IN_GAME;
    game.state.currentRound = firstRound;

    session.status = SessionStatus.IN_GAME;
    session.currentGame = game;

    await this.saveSession(this.getLightSession(session));
    return session;
  }

  /////////////////////////
  // Current game method //
  /////////////////////////

  async createGame(session: Session, visitorId?: string): Promise<Game> {
    const guessObjects: FullGuessObject[] =
      await this.guessObjectService.findShuffledGuessObjectsByGameConfig(
        session.gameConfig,
      );
    const guessObjectIds = guessObjects.map((obj) => obj.id);

    const game: Game = {
      id: await this.generateUniqueGameID(),
      config: session.gameConfig,
      status: GameStatus.STARTING,
      state: {
        guessObjectsIds: guessObjectIds,
        results: session.players.reduce(
          (acc, player) => {
            acc[player.username] = { results: [] };
            return acc;
          },
          {} as Record<string, PlayerResults>,
        ),
        guessObjects: guessObjects,
      },
    };

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'game_started',
          visitorId,
          properties: {
            mode: session.mode,
            categories: session.gameConfig.categories,
            numberOfPlayers:
              session.mode === SessionMode.SOLO
                ? session.players.length
                : (session.players as OnlinePlayer[]).filter(
                    (player) => player.connected,
                  ).length,
          },
        }),
      );
    }

    return game;
  }

  async handleGuess(socketID: string, guess: Guess) {
    const player = await this.playerService.getPlayer(socketID);
    if (!player)
      throw new NotFoundException({
        code: ErrorCode.PLAYER_NOT_FOUND,
        message: `No player associated with this socket`,
      });

    const { playerID, sessionID } = player;

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

        const playerConnected = (session.players as OnlinePlayer[]).some(
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

        if (
          game.state.currentRound.playersGuesses &&
          !game.state.currentRound.playersGuesses[playerID]
        ) {
          game.state.currentRound.playersGuesses[playerID] = guess;

          const connectedPlayers = (session.players as OnlinePlayer[]).filter(
            (player) => player.connected,
          );
          const playersGuesses = game.state.currentRound.playersGuesses;
          const allConnectedPlayersGuessed = connectedPlayers.every((player) =>
            Object.hasOwn(playersGuesses, player.username),
          );
          if (allConnectedPlayersGuessed) {
            for (const player of session.players) {
              if (!game.state.currentRound.playersGuesses[player.username]) {
                game.state.currentRound.playersGuesses[player.username] =
                  defaultGuess;
              }
            }

            game.state.currentRound.status = RoundStatus.SHOWING_RESULTS;
          }

          session.currentGame = game;
          await this.saveSession(session);
        }
        return session;
      },
    );
  }

  async handleNextRound(socketID: string, visitorId?: string) {
    const player = await this.playerService.getPlayer(socketID);
    if (!player)
      throw new NotFoundException({
        code: ErrorCode.PLAYER_NOT_FOUND,
        message: `No player associated with this socket`,
      });

    const { playerID, sessionID } = player;

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

    const currentIndex = game.state.guessObjectsIds.findIndex(
      (id: string) => id === game.state.currentRound?.guessObjectId,
    );

    session.players.forEach((player) => {
      const guess = game.state.currentRound?.playersGuesses?.[player.username];
      const playerResults = game.state.results[player.username];

      const newResult = {
        guessObjectId: game.state.currentRound?.guessObjectId ?? '',
        distance: guess ? guess.distance : -1,
        points: guess ? guess.points : 0,
      };

      if (playerResults?.results) {
        playerResults.results.push(newResult);
      } else {
        game.state.results[player.username] = { results: [newResult] };
      }
    });

    if (currentIndex + 1 >= game.state.guessObjectsIds.length) {
      await this.endGame(session, game, visitorId);

      const lobbySession: Session = {
        ...session,
        status: SessionStatus.IN_LOBBY,
        currentGame: undefined,
      };
      await this.saveSession(lobbySession);

      game.status = GameStatus.IN_RESULTS;
      session.currentGame = game;
    } else {
      game.state.currentRound = {
        status: RoundStatus.GUESSING,
        guessObjectId: game.state.guessObjectsIds[currentIndex + 1],
        playersGuesses: {},
      };

      session.currentGame = game;
      await this.saveSession(session);
    }

    return session;
  }

  async endSoloGame(sessionDto: Session, visitorId?: string) {
    if (!sessionDto.currentGame) return;
    await this.endGame(sessionDto, sessionDto.currentGame, visitorId);
  }

  ///////////////////////
  // Connection method //
  ///////////////////////

  async reconnectPlayer(
    socketID: string,
    sessionID: string,
    playerID: string,
    user?: User,
  ) {
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

        const players = session.players as OnlinePlayer[];

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

        await this.playerService.save(socketID, playerID, sessionID, !user);

        players[playerIndex].connected = true;

        if (session.hostID === '') session.hostID = playerID;

        await this.saveSession(session);
        return session;
      },
    );
  }

  async disconnectPlayer(socketID: string): Promise<Session | undefined> {
    const player = await this.playerService.getPlayer(socketID);
    if (!player) return;

    const { playerID, sessionID } = player;

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

        (session.players[playerIndex] as OnlinePlayer).connected = false;

        const isHost = playerID === session.hostID;
        if (isHost) {
          const players = session.players as OnlinePlayer[];

          const connectedPlayers = players.filter(
            (player) => player.connected && player.username !== playerID,
          );
          if (connectedPlayers.length > 0) {
            session.hostID = connectedPlayers[0].username;
          } else {
            session.hostID = '';
          }
        }

        await this.playerService.deletePlayer(socketID);
        await this.saveSession(session);

        return session;
      },
    );
  }

  ///////////
  // Store //
  ///////////

  private async getSession(sessionID: string): Promise<Session | null> {
    return await this.redisService.getJSON<Session>(this.getKey(sessionID));
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

  private async endGame(
    session: Session,
    game: Game,
    visitorId?: string,
  ): Promise<void> {
    try {
      const game_record = await this.prisma.gameRecord.create({
        data: {
          mode: session.mode,
          gameConfig: session.gameConfig as unknown as Prisma.InputJsonValue,
          players: session.players as unknown as Prisma.InputJsonValue,
          guessObjectsIds: game.state.guessObjectsIds,
          results: game.state.results as unknown as Prisma.InputJsonValue,
          users: {
            connect: session.players
              .filter((player) => !player.isGuest)
              .map((player) => ({ id: player.id })),
          },
        },
      });

      if (visitorId) {
        await this.eventService.trackEvent(
          createEvent({
            name: 'game_finished',
            visitorId,
            properties: {
              gameId: game_record.id.toString(),
              mode: session.mode,
              numberOfPlayers: game.state.results
                ? Object.keys(game.state.results).length
                : 0,
              average_score: game.state.results
                ? Object.values(game.state.results)
                    .flatMap((res) => res.results)
                    .reduce((sum, r) => sum + r.points, 0) /
                  Object.values(game.state.results).flatMap(
                    (res) => res.results,
                  ).length
                : 0,
            },
          }),
        );
      }
    } catch (error) {
      this.logger.error(`Error storing game in db: ${error}`);
    }
  }

  private async generateUniqueSessionID(): Promise<string> {
    const MAX_ATTEMPTS = 3;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const candidateId = this.idService.generateNanoId();
      if (!(await this.getSession(candidateId))) return candidateId.toString();
    }

    throw new InternalServerErrorException({
      code: ErrorCode.SESSION_CREATION_FAILED,
      message: 'Max id generation attempt reached',
    });
  }

  async generateUniqueGameID(): Promise<string> {
    const candidateId = this.idService.generateUniqueNamesId();
    return candidateId.toString(); // TODO Check in supabase and redis for conflicts
  }

  private getLightSession(session: Session): Session {
    let lightSession = session;

    if (session.currentGame) {
      const { guessObjects, ...restState } = session.currentGame.state;

      lightSession = {
        ...session,
        currentGame: {
          ...session.currentGame,
          state: {
            ...restState,
          },
        },
      };
    }

    return lightSession;
  }
}
