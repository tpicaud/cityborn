import {
  buildGame,
  buildSession,
  PlayerIdSchema,
  type Session,
  type SessionId,
  SessionIdSchema,
} from '@cityborn/api';
import { RedisSessionRepository } from '../../src/session/repositories/redis-session.repository';
import type { StoredSession } from '../../src/session/repositories/session.repository';
import { createTestInfrastructure } from '../support/infrastructure';

describe('RedisSessionRepository', () => {
  const infrastructure: ReturnType<typeof createTestInfrastructure> =
    createTestInfrastructure();
  const sessionRepository: RedisSessionRepository = new RedisSessionRepository(
    infrastructure.redis,
  );

  beforeEach(async () => {
    await infrastructure.redis.flushdb();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await infrastructure.close();
  });

  describe('find', () => {
    it('returns null for an unknown session', async () => {
      const storedSession: StoredSession | null = await sessionRepository.find(
        SessionIdSchema.parse('unknown'),
      );

      expect(storedSession).toBeNull();
    });

    it('rejects a record that is not JSON', async () => {
      await infrastructure.redis.set('session:corrupted', '{not json');

      await expect(
        sessionRepository.find(SessionIdSchema.parse('corrupted')),
      ).rejects.toThrow(SyntaxError);
    });

    it('rejects a session stored in the previous format', async () => {
      const session: Session = buildSession();
      await infrastructure.redis.set(
        `session:${session.id}`,
        JSON.stringify(session),
      );

      await expect(sessionRepository.find(session.id)).rejects.toThrow();
    });
  });

  describe('save', () => {
    it('stores the session with its reconnect token hashes and round deadline', async () => {
      const storedSession: StoredSession = {
        session: buildSession({ currentGame: buildGame() }),
        reconnectTokenHashes: { [PlayerIdSchema.parse('guest')]: 'guest-hash' },
        roundDeadline: 1_030_000,
      };

      await sessionRepository.save(storedSession);

      expect(await sessionRepository.find(storedSession.session.id)).toEqual(
        storedSession,
      );
    });

    it('keeps the reconnect token hash of a player named __proto__', async () => {
      const storedSession: StoredSession = {
        session: buildSession(),
        reconnectTokenHashes: {
          [PlayerIdSchema.parse('__proto__')]: 'proto-hash',
        },
        roundDeadline: null,
      };

      await sessionRepository.save(storedSession);

      expect(await sessionRepository.find(storedSession.session.id)).toEqual(
        storedSession,
      );
    });

    it('replaces the previous record of the session', async () => {
      const session: Session = buildSession();
      await sessionRepository.save({
        session,
        reconnectTokenHashes: { [PlayerIdSchema.parse('guest')]: 'guest-hash' },
        roundDeadline: 1_000_000,
      });

      await sessionRepository.save({
        session,
        reconnectTokenHashes: {},
        roundDeadline: null,
      });

      expect(await sessionRepository.find(session.id)).toEqual({
        session,
        reconnectTokenHashes: {},
        roundDeadline: null,
      });
    });

    it('stores a single key expiring after ten minutes and its index entry', async () => {
      const session: Session = buildSession();
      const now: number = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      await sessionRepository.save({
        session,
        reconnectTokenHashes: {},
        roundDeadline: null,
      });

      expect((await infrastructure.redis.keys('*')).sort()).toEqual([
        'session-expirations',
        `session:${session.id}`,
      ]);
      expect(
        await infrastructure.redis.ttl(`session:${session.id}`),
      ).toBeGreaterThan(590);
      expect(
        await infrastructure.redis.zscore('session-expirations', session.id),
      ).toBe(String(now + 600_000));
    });

    it('rejects when the transaction reports a command error', async () => {
      const session: Session = buildSession();
      await infrastructure.redis.set('session-expirations', 'not a sorted set');

      await expect(
        sessionRepository.save({
          session,
          reconnectTokenHashes: {},
          roundDeadline: null,
        }),
      ).rejects.toThrow(/WRONGTYPE/);
    });
  });

  describe('listActiveIds', () => {
    it('lists the saved sessions and prunes the expired ones from the index', async () => {
      const activeSession: Session = buildSession({
        id: SessionIdSchema.parse('active'),
      });
      const expiredSession: Session = buildSession({
        id: SessionIdSchema.parse('expired'),
      });
      const now: number = Date.now();
      jest.spyOn(Date, 'now').mockReturnValueOnce(now - 600_001);
      await sessionRepository.save({
        session: expiredSession,
        reconnectTokenHashes: {},
        roundDeadline: null,
      });
      await sessionRepository.save({
        session: activeSession,
        reconnectTokenHashes: {},
        roundDeadline: null,
      });

      const activeIds: SessionId[] = await sessionRepository.listActiveIds();

      expect(activeIds).toEqual(['active']);
      expect(
        await infrastructure.redis.zscore('session-expirations', 'expired'),
      ).toBeNull();
    });
  });
});
