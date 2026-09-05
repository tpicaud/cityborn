import { ErrorCode, type Session } from '@cityborn/api';
import { NotFoundException } from '@nestjs/common';
import { createMock } from '../../test/support/createMock';
import { buildGame, buildSession, player } from '../../test/support/fixtures';
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

  const sessionService = new SessionService(
    redisService,
    lockService,
    createMock<IdService>(),
    createMock<GameService>(),
    createMock<EventService>(),
  );

  return { sessionService, redisService };
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
      players: [player('host'), player('bob'), player('carol', false)],
    });
    const { sessionService } = buildSessionService(session);

    const result = await sessionService.kickPlayer('host', 's1', 'host');

    expect(result.hostID).toBe('bob');
  });

  it('clears the host when no connected player remains after the kick', async () => {
    const session = buildSession({
      players: [player('host'), player('bob', false)],
    });
    const { sessionService } = buildSessionService(session);

    const result = await sessionService.kickPlayer('host', 's1', 'host');

    expect(result.hostID).toBe('');
  });
});
