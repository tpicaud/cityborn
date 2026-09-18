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
  SessionStatus,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import type { EventService } from '../event/event.service';
import type { GameService } from '../game/game.service';
import type { IdService } from '../id/id.service';
import type { LockService } from '../lock/lock.service';
import type { RedisService } from '../redis/redis.service';
import { SessionService } from './session.service';

const playerId: (value: string) => PlayerId = (value: string) =>
  PlayerIdSchema.parse(value);
const sessionId: (value: string) => SessionId = (value: string) =>
  SessionIdSchema.parse(value);

function buildSessionService(session: Session | null) {
  const redisService: DeepMocked<RedisService> = createMock<RedisService>();
  redisService.getJSON.mockResolvedValue(session);
  redisService.setJSON.mockResolvedValue(undefined);
  const lockService: DeepMocked<LockService> = createMock<LockService>({
    withLock: async (_resource, _ttl, callback) => callback(),
  });

  const idService: DeepMocked<IdService> = createMock<IdService>();
  const gameService: DeepMocked<GameService> = createMock<GameService>();
  const eventService: DeepMocked<EventService> = createMock<EventService>();

  const sessionService: SessionService = new SessionService(
    redisService,
    lockService,
    idService,
    gameService,
    eventService,
  );

  return { sessionService, redisService, idService, gameService, eventService };
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

      const result: Session = await sessionService.join(
        session.id,
        playerId('alice'),
        user,
      );

      expect(result.hostID).toBe(playerId('alice'));
      expect(result.players).toEqual([
        expect.objectContaining({
          username: playerId('alice'),
          id: user.id,
          isGuest: false,
          connected: true,
        }),
      ]);
      expect(redisService.setJSON).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate player', async () => {
      const session: Session = buildSession();
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      await expect(
        sessionService.join(session.id, playerId('host')),
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

    it('does not persist when a duplicate guess leaves the game unchanged', async () => {
      const game: Game = buildGame({
        state: buildGameState({ currentRound: buildRound() }),
      });
      const session: Session = buildSession({ currentGame: game });
      const {
        sessionService,
        redisService,
        gameService,
      }: ReturnType<typeof buildSessionService> = buildSessionService(session);
      gameService.applyGuess.mockImplementation((currentGame) => currentGame);

      await sessionService.handleGuess(
        playerId('host'),
        session.id,
        defaultGuess,
      );

      expect(redisService.setJSON).not.toHaveBeenCalled();
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
    it('reconnects a player and restores the vacant host role', async () => {
      const user: User = buildUser({ username: playerId('host') });
      const session: Session = buildSession({
        hostID: '',
        players: [buildPlayer(playerId('host'), false)],
      });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      const result: Session = await sessionService.reconnectPlayer(
        session.id,
        playerId('host'),
        user,
      );

      expect(result.hostID).toBe(playerId('host'));
      expect(result.players[0]).toEqual(
        expect.objectContaining({ connected: true }),
      );
    });

    it('rejects reconnecting a registered player without credentials', async () => {
      const session: Session = buildSession({
        players: [buildPlayer(playerId('host'), false, { isGuest: false })],
      });
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      await expect(
        sessionService.reconnectPlayer(session.id, playerId('host')),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
      });
    });
  });

  describe('disconnectPlayer', () => {
    it('disconnects a player and reassigns the host', async () => {
      const session: Session = buildSession();
      const { sessionService }: ReturnType<typeof buildSessionService> =
        buildSessionService(session);

      const result: Session = await sessionService.disconnectPlayer(
        playerId('host'),
        session.id,
      );

      expect(result.hostID).toBe(playerId('bob'));
      expect(result.players[0]).toEqual(
        expect.objectContaining({ connected: false }),
      );
    });
  });
});
