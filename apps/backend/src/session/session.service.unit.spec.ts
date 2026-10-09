import type {
  CreateSession,
  Game,
  GameConfig,
  PlayerId,
  SessionId,
  User,
} from '@cityborn/api';
import {
  buildGame,
  buildGameConfig,
  buildGameState,
  buildPlayer,
  buildRound,
  buildSession,
  buildUser,
  defaultGuess,
  ErrorCode,
  PlayerIdSchema,
  type Session,
  SessionIdSchema,
  SessionMode,
  type SessionReconnectToken,
  SessionReconnectTokenSchema,
  SessionStatus,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import type { ConnectionRegistryService } from '../connection-registry/connection-registry.service';
import type { EventService } from '../event/event.service';
import type { GameService } from '../game/game.service';
import type { IdService } from '../id/id.service';
import type { LockService } from '../lock/lock.service';
import type { RedisService } from '../redis/redis.service';
import { type JoinedSession, SessionService } from './session.service';

const playerId: (value: string) => PlayerId = (value: string) =>
  PlayerIdSchema.parse(value);
const sessionId: (value: string) => SessionId = (value: string) =>
  SessionIdSchema.parse(value);

function buildSessionService(session: Session | null) {
  const redisService: DeepMocked<RedisService> = createMock<RedisService>();
  redisService.getJSON.mockResolvedValue(session);
  redisService.setJSON.mockImplementation(async (_key, storedSession) => {
    redisService.getJSON.mockResolvedValue(storedSession);
  });
  const storedHashes: Map<string, string> = new Map<string, string>();
  redisService.hset.mockImplementation(async (key, field, value) => {
    storedHashes.set(`${key}:${field}`, value);
  });
  redisService.hget.mockImplementation(
    async (key, field) => storedHashes.get(`${key}:${field}`) ?? null,
  );
  const lockService: DeepMocked<LockService> = createMock<LockService>({
    withLock: async (_resource, _ttl, callback) => callback(),
  });

  const idService: DeepMocked<IdService> = createMock<IdService>();
  const gameService: DeepMocked<GameService> = createMock<GameService>();
  const eventService: DeepMocked<EventService> = createMock<EventService>();
  const connectionRegistryService: DeepMocked<ConnectionRegistryService> =
    createMock<ConnectionRegistryService>();
  connectionRegistryService.register.mockResolvedValue(undefined);
  connectionRegistryService.hasLiveConnection.mockResolvedValue(false);

  const sessionService: SessionService = new SessionService(
    redisService,
    lockService,
    idService,
    gameService,
    eventService,
    connectionRegistryService,
  );

  return {
    sessionService,
    redisService,
    lockService,
    idService,
    gameService,
    eventService,
    connectionRegistryService,
  };
}

describe('SessionService.kickPlayer', () => {
  it('removes the kicked player and persists the session', async () => {
    const session: Session = buildSession();
    const {
      sessionService,
      redisService,
    }: ReturnType<typeof buildSessionService> = buildSessionService(session);

    const result: Session = await sessionService.kickPlayer(
      playerId('host'),
      sessionId('s1'),
      playerId('bob'),
    );

    expect(result.players.map((p) => p.username)).toEqual([playerId('host')]);
    expect(redisService.setJSON).toHaveBeenCalledTimes(1);
  });

  it('rejects when the requester is not the host', async () => {
    const { sessionService }: ReturnType<typeof buildSessionService> =
      buildSessionService(buildSession());

    await expect(
      sessionService.kickPlayer(
        playerId('bob'),
        sessionId('s1'),
        playerId('host'),
      ),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_FORBIDDEN_HOST },
    });
  });

  it('rejects when the session has no such player', async () => {
    const { sessionService }: ReturnType<typeof buildSessionService> =
      buildSessionService(buildSession());

    await expect(
      sessionService.kickPlayer(
        playerId('host'),
        sessionId('s1'),
        playerId('unknown'),
      ),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_PLAYER_NOT_FOUND },
    });
  });

  it('rejects once a game is in progress', async () => {
    const session: Session = buildSession({ currentGame: buildGame() });
    const { sessionService }: ReturnType<typeof buildSessionService> =
      buildSessionService(session);

    await expect(
      sessionService.kickPlayer(
        playerId('host'),
        sessionId('s1'),
        playerId('bob'),
      ),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_ALREADY_IN_GAME },
    });
  });

  it('rejects when the session does not exist', async () => {
    const { sessionService }: ReturnType<typeof buildSessionService> =
      buildSessionService(null);

    await expect(
      sessionService.kickPlayer(
        playerId('host'),
        sessionId('s1'),
        playerId('bob'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reassigns the host to another connected player when the host kicks itself', async () => {
    const session: Session = buildSession({
      players: [
        buildPlayer(playerId('host')),
        buildPlayer(playerId('bob')),
        buildPlayer(playerId('carol'), false),
      ],
    });
    const { sessionService }: ReturnType<typeof buildSessionService> =
      buildSessionService(session);

    const result: Session = await sessionService.kickPlayer(
      playerId('host'),
      sessionId('s1'),
      playerId('host'),
    );

    expect(result.hostID).toBe(playerId('bob'));
  });

  it('clears the host when no connected player remains after the kick', async () => {
    const session: Session = buildSession({
      players: [
        buildPlayer(playerId('host')),
        buildPlayer(playerId('bob'), false),
      ],
    });
    const { sessionService }: ReturnType<typeof buildSessionService> =
      buildSessionService(session);

    const result: Session = await sessionService.kickPlayer(
      playerId('host'),
      sessionId('s1'),
      playerId('host'),
    );

    expect(result.hostID).toBe('');
  });
});
describe('SessionService.create', () => {
  it('creates and persists a multiplayer session', async () => {
    const {
      sessionService,
      redisService,
      idService,
      eventService,
    }: ReturnType<typeof buildSessionService> = buildSessionService(null);
    const user: User = buildUser();
    const createData: CreateSession = { mode: SessionMode.MULTI };
    idService.generateNanoId.mockReturnValue('new-session');

    const result: Session = await sessionService.create(
      createData,
      user,
      'visitor-1',
    );

    expect(result).toMatchObject({
      id: 'new-session',
      mode: SessionMode.MULTI,
      status: SessionStatus.IN_LOBBY,
      hostID: '',
      players: [],
    });
    expect(redisService.setJSON).toHaveBeenCalledWith(
      'session:new-session',
      result,
      1800,
    );
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'session_created',
        visitorId: 'visitor-1',
      }),
    );
  });

  it('creates a guest solo session without persisting it', async () => {
    const {
      sessionService,
      redisService,
      idService,
    }: ReturnType<typeof buildSessionService> = buildSessionService(null);
    const createData: CreateSession = { mode: SessionMode.SOLO };
    idService.generateNanoId.mockReturnValue('solo-session');

    const result: Session = await sessionService.create(createData);

    expect(result.hostID).toBe('guest');
    expect(result.players).toEqual([
      expect.objectContaining({ username: 'guest', isGuest: true }),
    ]);
    expect(redisService.setJSON).not.toHaveBeenCalled();
  });

  it('fails after three session identifier collisions', async () => {
    const {
      sessionService,
      idService,
    }: ReturnType<typeof buildSessionService> = buildSessionService(
      buildSession(),
    );
    const createData: CreateSession = { mode: SessionMode.MULTI };
    idService.generateNanoId.mockReturnValue('duplicate');

    await expect(sessionService.create(createData)).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_CREATION_FAILED },
    });
    expect(idService.generateNanoId).toHaveBeenCalledTimes(3);
  });
});

describe('SessionService lobby operations', () => {
  describe('getById', () => {
    it('returns an existing session', async () => {
      const session: Session = buildSession();
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      await expect(sessionService.getById(session.id)).resolves.toStrictEqual(
        session,
      );
    });

    it('rejects a missing session', async () => {
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(null);

      await expect(
        sessionService.getById(sessionId('missing')),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_NOT_FOUND },
      });
    });
  });

  describe('join', () => {
    it('adds the first player as host', async () => {
      const session: Session = buildSession({ hostID: '', players: [] });
      const user: User = buildUser({ username: playerId('alice') });
      const {
        sessionService,
        redisService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(session);

      const result: JoinedSession = await sessionService.join({
        sessionID: session.id,
        playerID: playerId('alice'),
        user,
        socketID: 'socket-1',
      });

      expect(result.session.hostID).toBe(playerId('alice'));
      expect(result.session.players).toEqual([
        expect.objectContaining({
          username: playerId('alice'),
          id: user.id,
          isGuest: false,
          connected: true,
        }),
      ]);
      expect(redisService.setJSON).toHaveBeenCalledTimes(1);
    });

    it('registers the socket of the joining player', async () => {
      const session: Session = buildSession({ players: [] });
      const {
        sessionService,
        connectionRegistryService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(session);

      await sessionService.join({
        sessionID: session.id,
        playerID: playerId('guest'),
        user: undefined,
        socketID: 'socket-1',
      });

      expect(connectionRegistryService.register).toHaveBeenCalledWith({
        socketID: 'socket-1',
        connection: {
          playerID: playerId('guest'),
          sessionID: session.id,
          isGuest: true,
        },
      });
    });

    it('issues a reconnect token only to a guest player', async () => {
      const session: Session = buildSession({ players: [] });
      const user: User = buildUser({ username: playerId('alice') });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      const guestJoin: JoinedSession = await sessionService.join({
        sessionID: session.id,
        playerID: playerId('guest'),
        user: undefined,
        socketID: 'socket-1',
      });
      const userJoin: JoinedSession = await sessionService.join({
        sessionID: session.id,
        playerID: playerId('alice'),
        user,
        socketID: 'socket-1',
      });

      expect(guestJoin.reconnectToken).toEqual(expect.any(String));
      expect(userJoin.reconnectToken).toBeUndefined();
    });

    it('expires the reconnect tokens together with the session', async () => {
      const session: Session = buildSession({ players: [] });
      const {
        sessionService,
        redisService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(session);

      await sessionService.join({
        sessionID: session.id,
        playerID: playerId('guest'),
        user: undefined,
        socketID: 'socket-1',
      });

      expect(redisService.setJSON).toHaveBeenCalledWith(
        `session:${session.id}`,
        expect.anything(),
        1800,
      );
      expect(redisService.expire).toHaveBeenCalledWith(
        `session:${session.id}:reconnect-token-hashes`,
        1800,
      );
    });

    it('rejects a duplicate player', async () => {
      const session: Session = buildSession();
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      await expect(
        sessionService.join({
          sessionID: session.id,
          playerID: playerId('host'),
          user: undefined,
          socketID: 'socket-1',
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_PLAYER_ALREADY_EXISTS },
      });
    });
  });

  describe('updateHost', () => {
    it('transfers the host role to a connected player', async () => {
      const session: Session = buildSession();
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      const result: Session = await sessionService.updateHost(
        playerId('host'),
        session.id,
        playerId('bob'),
      );

      expect(result.hostID).toBe(playerId('bob'));
    });

    it('rejects transferring the host role to a disconnected player', async () => {
      const session: Session = buildSession({
        players: [
          buildPlayer(playerId('host')),
          buildPlayer(playerId('bob'), false),
        ],
      });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      await expect(
        sessionService.updateHost(
          playerId('host'),
          session.id,
          playerId('bob'),
        ),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_PLAYER_NOT_FOUND },
      });
    });
  });

  describe('updateGameConfig', () => {
    it('updates the game configuration for the host', async () => {
      const session: Session = buildSession();
      const gameConfig: GameConfig = buildGameConfig({ timer: 45 });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      const result: Session = await sessionService.updateGameConfig(
        playerId('host'),
        session.id,
        gameConfig,
      );

      expect(result.gameConfig).toEqual(gameConfig);
    });

    it('rejects a game configuration update from another player', async () => {
      const session: Session = buildSession();
      const gameConfig: GameConfig = buildGameConfig();
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      await expect(
        sessionService.updateGameConfig(
          playerId('bob'),
          session.id,
          gameConfig,
        ),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_FORBIDDEN_HOST },
      });
    });
  });
});

describe('SessionService game operations', () => {
  describe('startGame', () => {
    it('starts a game and persists its light representation', async () => {
      const session: Session = buildSession();
      const game: Game = buildGame();
      const startedGame: Game = buildGame({ id: game.id });
      const lightGame: Game = buildGame({ id: game.id });
      const {
        sessionService,
        redisService,
        gameService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(session);
      gameService.createGame.mockResolvedValue(game);
      gameService.beginGame.mockReturnValue(startedGame);
      gameService.toLightGame.mockReturnValue(lightGame);

      const result: Session = await sessionService.startGame(
        playerId('host'),
        session.id,
        'visitor-1',
      );

      expect(result.status).toBe(SessionStatus.IN_GAME);
      expect(result.currentGame).toBe(startedGame);
      expect(redisService.setJSON).toHaveBeenCalledWith(
        `session:${session.id}`,
        expect.objectContaining({ currentGame: lightGame }),
        1800,
      );
    });

    it('rejects starting a second game', async () => {
      const session: Session = buildSession({ currentGame: buildGame() });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      await expect(
        sessionService.startGame(playerId('host'), session.id),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_ALREADY_IN_GAME },
      });
    });
  });

  describe('handleGuess', () => {
    it('applies a guess from a connected player', async () => {
      const game: Game = buildGame({
        state: buildGameState({ currentRound: buildRound() }),
      });
      const updatedGame: Game = buildGame({ id: game.id });
      const session: Session = buildSession({
        status: SessionStatus.IN_GAME,
        currentGame: game,
      });
      const {
        sessionService,
        redisService,
        gameService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(session);
      gameService.applyGuess.mockReturnValue(updatedGame);

      const result: Session = await sessionService.handleGuess(
        playerId('host'),
        session.id,
        defaultGuess,
      );

      expect(gameService.applyGuess).toHaveBeenCalledWith(
        game,
        playerId('host'),
        defaultGuess,
        [playerId('host'), playerId('bob')],
      );
      expect(result.currentGame).toBe(updatedGame);
      expect(redisService.setJSON).toHaveBeenCalledTimes(1);
    });

    it('rejects a guess from a disconnected player', async () => {
      const game: Game = buildGame({
        state: buildGameState({ currentRound: buildRound() }),
      });
      const session: Session = buildSession({
        currentGame: game,
        players: [buildPlayer(playerId('host'), false)],
      });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      await expect(
        sessionService.handleGuess(playerId('host'), session.id, defaultGuess),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_PLAYER_NOT_CONNECTED },
      });
    });
  });

  describe('handleNextRound', () => {
    it('returns to the lobby after the last round', async () => {
      const game: Game = buildGame();
      const completedGame: Game = buildGame({ id: game.id });
      const session: Session = buildSession({
        status: SessionStatus.IN_GAME,
        currentGame: game,
      });
      const {
        sessionService,
        redisService,
        gameService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(session);
      gameService.resolveNextRound.mockReturnValue({
        game: completedGame,
        isGameOver: true,
      });
      gameService.endGame.mockResolvedValue(undefined);

      const result: Session = await sessionService.handleNextRound(
        playerId('host'),
        session.id,
        'visitor-1',
      );

      expect(gameService.endGame).toHaveBeenCalledWith(
        completedGame,
        session.players,
        session.mode,
        'visitor-1',
      );
      expect(redisService.setJSON).toHaveBeenCalledWith(
        `session:${session.id}`,
        expect.objectContaining({
          status: SessionStatus.IN_LOBBY,
          currentGame: undefined,
        }),
        1800,
      );
      expect(result.currentGame).toBe(completedGame);
    });
  });
});

describe('SessionService connection operations', () => {
  describe('reconnectPlayer', () => {
    it('reconnects a registered player and restores the vacant host role', async () => {
      const user: User = buildUser({ username: playerId('host') });
      const session: Session = buildSession({
        hostID: '',
        players: [buildPlayer(playerId('host'), false, { id: user.id })],
      });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      const result: Session = await sessionService.reconnectPlayer({
        sessionID: session.id,
        playerID: playerId('host'),
        reconnectToken: undefined,
        user,
        socketID: 'socket-2',
      });

      expect(result.hostID).toBe(playerId('host'));
      expect(result.players[0]).toEqual(
        expect.objectContaining({ connected: true }),
      );
    });

    it('registers the socket of the reconnected player', async () => {
      const user: User = buildUser({ username: playerId('host') });
      const session: Session = buildSession({
        players: [buildPlayer(playerId('host'), false, { id: user.id })],
      });
      const {
        sessionService,
        connectionRegistryService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(session);

      await sessionService.reconnectPlayer({
        sessionID: session.id,
        playerID: playerId('host'),
        reconnectToken: undefined,
        user,
        socketID: 'socket-2',
      });

      expect(connectionRegistryService.register).toHaveBeenCalledWith({
        socketID: 'socket-2',
        connection: {
          playerID: playerId('host'),
          sessionID: session.id,
          isGuest: false,
        },
      });
    });

    it('does not register the socket of a rejected reconnection', async () => {
      const owner: User = buildUser({ username: playerId('host') });
      const intruder: User = buildUser({
        id: '00000000-0000-4000-8000-000000000002',
        username: playerId('intruder'),
      });
      const session: Session = buildSession({
        players: [buildPlayer(playerId('host'), false, { id: owner.id })],
      });
      const {
        sessionService,
        connectionRegistryService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(session);

      await expect(
        sessionService.reconnectPlayer({
          sessionID: session.id,
          playerID: playerId('host'),
          reconnectToken: undefined,
          user: intruder,
          socketID: 'socket-2',
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_RECONNECT_FORBIDDEN },
      });
      expect(connectionRegistryService.register).not.toHaveBeenCalled();
    });

    it('rejects reconnecting a registered player without credentials', async () => {
      const session: Session = buildSession({
        players: [buildPlayer(playerId('host'), false, { isGuest: false })],
      });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      await expect(
        sessionService.reconnectPlayer({
          sessionID: session.id,
          playerID: playerId('host'),
          reconnectToken: undefined,
          user: undefined,
          socketID: 'socket-2',
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
      });
    });

    it('rejects reconnecting a registered player owned by another user', async () => {
      const owner: User = buildUser({ username: playerId('host') });
      const intruder: User = buildUser({
        id: '00000000-0000-4000-8000-000000000002',
        username: playerId('intruder'),
      });
      const session: Session = buildSession({
        players: [buildPlayer(playerId('host'), false, { id: owner.id })],
      });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      await expect(
        sessionService.reconnectPlayer({
          sessionID: session.id,
          playerID: playerId('host'),
          reconnectToken: undefined,
          user: intruder,
          socketID: 'socket-2',
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_RECONNECT_FORBIDDEN },
      });
    });

    it('reconnects a guest player with the token issued when joining', async () => {
      const session: Session = buildSession({ players: [] });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);
      const { reconnectToken }: JoinedSession = await sessionService.join({
        sessionID: session.id,
        playerID: playerId('guest'),
        user: undefined,
        socketID: 'socket-1',
      });
      await sessionService.disconnectAbsentPlayer({
        sessionID: session.id,
        playerID: playerId('guest'),
      });

      const result: Session = await sessionService.reconnectPlayer({
        sessionID: session.id,
        playerID: playerId('guest'),
        reconnectToken,
        user: undefined,
        socketID: 'socket-2',
      });

      expect(result.players[0]).toEqual(
        expect.objectContaining({
          username: playerId('guest'),
          connected: true,
        }),
      );
    });

    it('rejects reconnecting a guest player with the token of another player', async () => {
      const session: Session = buildSession({ players: [] });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);
      await sessionService.join({
        sessionID: session.id,
        playerID: playerId('victim'),
        user: undefined,
        socketID: 'socket-1',
      });
      const { reconnectToken }: JoinedSession = await sessionService.join({
        sessionID: session.id,
        playerID: playerId('intruder'),
        user: undefined,
        socketID: 'socket-1',
      });

      await expect(
        sessionService.reconnectPlayer({
          sessionID: session.id,
          playerID: playerId('victim'),
          reconnectToken,
          user: undefined,
          socketID: 'socket-2',
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_RECONNECT_FORBIDDEN },
      });
    });

    it('rejects reconnecting a guest player without a token', async () => {
      const session: Session = buildSession({ players: [] });
      const user: User = buildUser({ username: playerId('intruder') });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);
      await sessionService.join({
        sessionID: session.id,
        playerID: playerId('victim'),
        user: undefined,
        socketID: 'socket-1',
      });

      await expect(
        sessionService.reconnectPlayer({
          sessionID: session.id,
          playerID: playerId('victim'),
          reconnectToken: undefined,
          user,
          socketID: 'socket-2',
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_RECONNECT_FORBIDDEN },
      });
    });

    it('rejects reconnecting a guest player with an unknown token', async () => {
      const session: Session = buildSession({ players: [] });
      const forgedToken: SessionReconnectToken =
        SessionReconnectTokenSchema.parse('forged-token');
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);
      await sessionService.join({
        sessionID: session.id,
        playerID: playerId('victim'),
        user: undefined,
        socketID: 'socket-1',
      });

      await expect(
        sessionService.reconnectPlayer({
          sessionID: session.id,
          playerID: playerId('victim'),
          reconnectToken: forgedToken,
          user: undefined,
          socketID: 'socket-2',
        }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_RECONNECT_FORBIDDEN },
      });
    });
  });

  describe('disconnectAbsentPlayer', () => {
    it('disconnects a player without live connection and reassigns the host', async () => {
      const session: Session = buildSession();
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      const result: Session | null =
        await sessionService.disconnectAbsentPlayer({
          sessionID: session.id,
          playerID: playerId('host'),
        });

      expect(result?.hostID).toBe(playerId('bob'));
      expect(result?.players[0]).toEqual(
        expect.objectContaining({
          username: playerId('host'),
          connected: false,
        }),
      );
    });

    it('keeps a player who still has a live connection', async () => {
      const session: Session = buildSession();
      const {
        sessionService,
        connectionRegistryService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(session);
      connectionRegistryService.hasLiveConnection.mockResolvedValue(true);

      const result: Session | null =
        await sessionService.disconnectAbsentPlayer({
          sessionID: session.id,
          playerID: playerId('host'),
        });

      expect(result).toBeNull();
      expect(connectionRegistryService.hasLiveConnection).toHaveBeenCalledWith({
        sessionID: session.id,
        playerID: playerId('host'),
      });
    });

    it('ignores a player already disconnected', async () => {
      const session: Session = buildSession({
        hostID: playerId('bob'),
        players: [buildPlayer(playerId('host'), false), buildPlayer('bob')],
      });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      const result: Session | null =
        await sessionService.disconnectAbsentPlayer({
          sessionID: session.id,
          playerID: playerId('host'),
        });

      expect(result).toBeNull();
    });

    it('ignores a player who left the session', async () => {
      const session: Session = buildSession();
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      const result: Session | null =
        await sessionService.disconnectAbsentPlayer({
          sessionID: session.id,
          playerID: playerId('kicked'),
        });

      expect(result).toBeNull();
    });

    it('ignores an expired session', async () => {
      const {
        sessionService,
        lockService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(null);

      const result: Session | null =
        await sessionService.disconnectAbsentPlayer({
          sessionID: sessionId('expired'),
          playerID: playerId('host'),
        });

      expect(result).toBeNull();
      expect(lockService.withLock).not.toHaveBeenCalled();
    });
  });
});

describe('SessionService session lock', () => {
  it.each<[string, (sessionService: SessionService) => Promise<Session>]>([
    [
      'updateHost',
      (sessionService) =>
        sessionService.updateHost(
          playerId('host'),
          sessionId('s1'),
          playerId('bob'),
        ),
    ],
    [
      'updateGameConfig',
      (sessionService) =>
        sessionService.updateGameConfig(
          playerId('host'),
          sessionId('s1'),
          buildGameConfig(),
        ),
    ],
    [
      'startGame',
      (sessionService) =>
        sessionService.startGame(playerId('host'), sessionId('s1')),
    ],
  ])('runs %s under the session lock', async (_operation, updateSession) => {
    const session: Session = buildSession({ id: sessionId('s1') });
    const {
      sessionService,
      lockService,
    }: ReturnType<typeof buildSessionService> = buildSessionService(session);

    await updateSession(sessionService);

    expect(lockService.withLock).toHaveBeenCalledWith(
      `session:${session.id}`,
      expect.any(Number),
      expect.any(Function),
    );
  });
});
