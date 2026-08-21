import {
  ErrorCode,
  type Game,
  GameStatus,
  type OnlinePlayer,
  type Session,
  SessionMode,
  SessionStatus,
} from '@cityborn/api';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { EventService } from '../event/event.service';
import type { GameService } from '../game/game.service';
import type { IdService } from '../id/id.service';
import type { LockService } from '../lock/lock.service';
import type { RedisService } from '../redis/redis.service';
import { SessionService } from './session.service';

jest.mock('../id/id.service', () => ({ IdService: class {} }));
jest.mock('../game/game.service', () => ({ GameService: class {} }));

function buildSessionService(session: Session | null) {
  const redisService = {
    getJSON: jest.fn().mockResolvedValue(session),
    setJSON: jest.fn().mockResolvedValue(undefined),
  };
  const lockService = {
    withLock: jest.fn(
      (_resource: string, _ttl: number, callback: () => unknown) => callback(),
    ),
  };

  const sessionService = new SessionService(
    redisService as unknown as RedisService,
    lockService as unknown as LockService,
    {} as unknown as IdService,
    {} as unknown as GameService,
    {} as unknown as EventService,
  );

  return { sessionService, redisService };
}

function player(username: string, connected = true): OnlinePlayer {
  return { username, isGuest: false, connected };
}

function baseSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    hostID: 'host',
    mode: SessionMode.MULTI,
    status: SessionStatus.IN_LOBBY,
    gameConfig: { categories: [], timer: 25, nbOfObjects: 6 },
    players: [player('host'), player('bob')],
    ...overrides,
  };
}

function baseGame(): Game {
  return {
    id: 'g1',
    config: { categories: [], timer: 25, nbOfObjects: 6 },
    status: GameStatus.IN_GAME,
    state: { guessObjectsIds: [], results: {} },
  };
}

describe('SessionService.kickPlayer', () => {
  it('removes the kicked player and persists the session', async () => {
    const session = baseSession();
    const { sessionService, redisService } = buildSessionService(session);

    const result = await sessionService.kickPlayer('host', 's1', 'bob');

    expect(result.players.map((p) => p.username)).toEqual(['host']);
    expect(redisService.setJSON).toHaveBeenCalledTimes(1);
  });

  it('rejects when the requester is not the host', async () => {
    const { sessionService } = buildSessionService(baseSession());

    const error = await sessionService
      .kickPlayer('bob', 's1', 'host')
      .catch((e) => e);

    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error).toMatchObject({
      response: { code: ErrorCode.SESSION_FORBIDDEN_HOST },
    });
  });

  it('rejects when the session has no such player', async () => {
    const { sessionService } = buildSessionService(baseSession());

    await expect(
      sessionService.kickPlayer('host', 's1', 'unknown'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_PLAYER_NOT_FOUND },
    });
  });

  it('rejects once a game is in progress', async () => {
    const session = baseSession({ currentGame: baseGame() });
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
    const session = baseSession({
      players: [player('host'), player('bob'), player('carol', false)],
    });
    const { sessionService } = buildSessionService(session);

    const result = await sessionService.kickPlayer('host', 's1', 'host');

    expect(result.hostID).toBe('bob');
  });

  it('clears the host when no connected player remains after the kick', async () => {
    const session = baseSession({
      players: [player('host'), player('bob', false)],
    });
    const { sessionService } = buildSessionService(session);

    const result = await sessionService.kickPlayer('host', 's1', 'host');

    expect(result.hostID).toBe('');
  });
});
