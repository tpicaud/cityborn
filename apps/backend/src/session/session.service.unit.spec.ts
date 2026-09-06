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
  type Session,
  SessionMode,
  SessionStatus,
} from '@cityborn/api';
import { NotFoundException } from '@nestjs/common';
import { createMock } from '../../test/support/createMock';
import type { EventService } from '../event/event.service';
import type { GameService } from '../game/game.service';
import type { IdService } from '../id/id.service';
import type { LockService } from '../lock/lock.service';
import type { RedisService } from '../redis/redis.service';
import { SessionService } from './session.service';

function buildSessionService(session: Session | null) {
  const redisService = createMock<RedisService>();
  redisService.getJSON.mockResolvedValue(session);
  redisService.setJSON.mockResolvedValue(undefined);
  const lockService = createMock<LockService>({
    withLock: async (_resource, _ttl, callback) => callback(),
  });

  const idService = createMock<IdService>();
  const gameService = createMock<GameService>();
  const eventService = createMock<EventService>();

  const sessionService = new SessionService(
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
    const session = buildSession();
    const { sessionService, redisService } = buildSessionService(session);

    const result = await sessionService.kickPlayer('host', 's1', 'bob');

    expect(result.players.map((p) => p.username)).toEqual(['host']);
    expect(redisService.setJSON).toHaveBeenCalledTimes(1);
  });

  it('rejects when the requester is not the host', async () => {
    const { sessionService } = buildSessionService(buildSession());

    await expect(
      sessionService.kickPlayer('bob', 's1', 'host'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_FORBIDDEN_HOST },
    });
  });

  it('rejects when the session has no such player', async () => {
    const { sessionService } = buildSessionService(buildSession());

    await expect(
      sessionService.kickPlayer('host', 's1', 'unknown'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_PLAYER_NOT_FOUND },
    });
  });

  it('rejects once a game is in progress', async () => {
    const session = buildSession({ currentGame: buildGame() });
    const { sessionService } = buildSessionService(session);

    await expect(
      sessionService.kickPlayer('host', 's1', 'bob'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_ALREADY_IN_GAME },
    });
  });

  it('rejects when the session does not exist', async () => {
    const { sessionService } = buildSessionService(null);

    await expect(
      sessionService.kickPlayer('host', 's1', 'bob'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reassigns the host to another connected player when the host kicks itself', async () => {
    const session = buildSession({
      players: [
        buildPlayer('host'),
        buildPlayer('bob'),
        buildPlayer('carol', false),
      ],
    });
    const { sessionService } = buildSessionService(session);

    const result = await sessionService.kickPlayer('host', 's1', 'host');

    expect(result.hostID).toBe('bob');
  });

  it('clears the host when no connected player remains after the kick', async () => {
    const session = buildSession({
      players: [buildPlayer('host'), buildPlayer('bob', false)],
    });
    const { sessionService } = buildSessionService(session);

    const result = await sessionService.kickPlayer('host', 's1', 'host');

    expect(result.hostID).toBe('');
  });
});
describe('SessionService.create', () => {
  it('creates and persists a multiplayer session', async () => {
    const { sessionService, redisService, idService, eventService } =
      buildSessionService(null);
    idService.generateNanoId.mockReturnValue('new-session');

    const result = await sessionService.create(
      { mode: SessionMode.MULTI },
      buildUser(),
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
    const { sessionService, redisService, idService } =
      buildSessionService(null);
    idService.generateNanoId.mockReturnValue('solo-session');

    const result = await sessionService.create({ mode: SessionMode.SOLO });

    expect(result.hostID).toBe('guest');
    expect(result.players).toEqual([
      expect.objectContaining({ username: 'guest', isGuest: true }),
    ]);
    expect(redisService.setJSON).not.toHaveBeenCalled();
  });

  it('fails after three session identifier collisions', async () => {
    const { sessionService, idService } = buildSessionService(buildSession());
    idService.generateNanoId.mockReturnValue('duplicate');

    await expect(
      sessionService.create({ mode: SessionMode.MULTI }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_CREATION_FAILED },
    });
    expect(idService.generateNanoId).toHaveBeenCalledTimes(3);
  });
});

describe('SessionService lobby operations', () => {
  it('returns an existing session', async () => {
    const session = buildSession();
    const { sessionService } = buildSessionService(session);

    await expect(sessionService.getById(session.id)).resolves.toBe(session);
  });

  it('rejects a missing session', async () => {
    const { sessionService } = buildSessionService(null);

    await expect(sessionService.getById('missing')).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_NOT_FOUND },
    });
  });

  it('adds the first player as host', async () => {
    const session = buildSession({ hostID: '', players: [] });
    const user = buildUser({ username: 'alice' });
    const { sessionService, redisService } = buildSessionService(session);

    const result = await sessionService.join(session.id, 'alice', user);

    expect(result.hostID).toBe('alice');
    expect(result.players).toEqual([
      expect.objectContaining({
        username: 'alice',
        id: user.id,
        isGuest: false,
        connected: true,
      }),
    ]);
    expect(redisService.setJSON).toHaveBeenCalledTimes(1);
  });

  it('rejects a duplicate player', async () => {
    const session = buildSession();
    const { sessionService } = buildSessionService(session);

    await expect(sessionService.join(session.id, 'host')).rejects.toMatchObject(
      {
        response: { code: ErrorCode.SESSION_PLAYER_ALREADY_EXISTS },
      },
    );
  });

  it('transfers the host role to a connected player', async () => {
    const session = buildSession();
    const { sessionService } = buildSessionService(session);

    const result = await sessionService.updateHost('host', session.id, 'bob');

    expect(result.hostID).toBe('bob');
  });

  it('rejects transferring the host role to a disconnected player', async () => {
    const session = buildSession({
      players: [buildPlayer('host'), buildPlayer('bob', false)],
    });
    const { sessionService } = buildSessionService(session);

    await expect(
      sessionService.updateHost('host', session.id, 'bob'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_PLAYER_NOT_FOUND },
    });
  });

  it('updates the game configuration for the host', async () => {
    const session = buildSession();
    const gameConfig = buildGameConfig({ timer: 45 });
    const { sessionService } = buildSessionService(session);

    const result = await sessionService.updateGameConfig(
      'host',
      session.id,
      gameConfig,
    );

    expect(result.gameConfig).toEqual(gameConfig);
  });

  it('rejects a game configuration update from another player', async () => {
    const session = buildSession();
    const { sessionService } = buildSessionService(session);

    await expect(
      sessionService.updateGameConfig('bob', session.id, buildGameConfig()),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_FORBIDDEN_HOST },
    });
  });
});

describe('SessionService game operations', () => {
  it('starts a game and persists its light representation', async () => {
    const session = buildSession();
    const game = buildGame();
    const startedGame = buildGame({ id: game.id });
    const lightGame = buildGame({ id: game.id });
    const { sessionService, redisService, gameService } =
      buildSessionService(session);
    gameService.createGame.mockResolvedValue(game);
    gameService.beginGame.mockReturnValue(startedGame);
    gameService.toLightGame.mockReturnValue(lightGame);

    const result = await sessionService.startGame(
      'host',
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
    const session = buildSession({ currentGame: buildGame() });
    const { sessionService } = buildSessionService(session);

    await expect(
      sessionService.startGame('host', session.id),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_ALREADY_IN_GAME },
    });
  });

  it('applies a guess from a connected player', async () => {
    const game = buildGame({
      state: buildGameState({ currentRound: buildRound() }),
    });
    const updatedGame = buildGame({ id: game.id });
    const session = buildSession({
      status: SessionStatus.IN_GAME,
      currentGame: game,
    });
    const { sessionService, redisService, gameService } =
      buildSessionService(session);
    gameService.applyGuess.mockReturnValue(updatedGame);

    const result = await sessionService.handleGuess(
      'host',
      session.id,
      defaultGuess,
    );

    expect(gameService.applyGuess).toHaveBeenCalledWith(
      game,
      'host',
      defaultGuess,
      ['host', 'bob'],
    );
    expect(result.currentGame).toBe(updatedGame);
    expect(redisService.setJSON).toHaveBeenCalledTimes(1);
  });

  it('does not persist when a duplicate guess leaves the game unchanged', async () => {
    const game = buildGame({
      state: buildGameState({ currentRound: buildRound() }),
    });
    const session = buildSession({ currentGame: game });
    const { sessionService, redisService, gameService } =
      buildSessionService(session);
    gameService.applyGuess.mockImplementation((currentGame) => currentGame);

    await sessionService.handleGuess('host', session.id, defaultGuess);

    expect(redisService.setJSON).not.toHaveBeenCalled();
  });

  it('rejects a guess from a disconnected player', async () => {
    const game = buildGame({
      state: buildGameState({ currentRound: buildRound() }),
    });
    const session = buildSession({
      currentGame: game,
      players: [buildPlayer('host', false)],
    });
    const { sessionService } = buildSessionService(session);

    await expect(
      sessionService.handleGuess('host', session.id, defaultGuess),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_PLAYER_NOT_CONNECTED },
    });
  });

  it('returns to the lobby after the last round', async () => {
    const game = buildGame();
    const completedGame = buildGame({ id: game.id });
    const session = buildSession({
      status: SessionStatus.IN_GAME,
      currentGame: game,
    });
    const { sessionService, redisService, gameService } =
      buildSessionService(session);
    gameService.resolveNextRound.mockReturnValue({
      game: completedGame,
      isGameOver: true,
    });
    gameService.endGame.mockResolvedValue(undefined);

    const result = await sessionService.handleNextRound(
      'host',
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

describe('SessionService connection operations', () => {
  it('reconnects a player and restores the vacant host role', async () => {
    const user = buildUser({ username: 'host' });
    const session = buildSession({
      hostID: '',
      players: [buildPlayer('host', false)],
    });
    const { sessionService } = buildSessionService(session);

    const result = await sessionService.reconnectPlayer(
      session.id,
      'host',
      user,
    );

    expect(result.hostID).toBe('host');
    expect(result.players[0]).toEqual(
      expect.objectContaining({ connected: true }),
    );
  });

  it('rejects reconnecting a registered player without credentials', async () => {
    const session = buildSession({
      players: [buildPlayer('host', false, { isGuest: false })],
    });
    const { sessionService } = buildSessionService(session);

    await expect(
      sessionService.reconnectPlayer(session.id, 'host'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('disconnects a player and reassigns the host', async () => {
    const session = buildSession();
    const { sessionService } = buildSessionService(session);

    const result = await sessionService.disconnectPlayer('host', session.id);

    expect(result.hostID).toBe('bob');
    expect(result.players[0]).toEqual(
      expect.objectContaining({ connected: false }),
    );
  });
});
