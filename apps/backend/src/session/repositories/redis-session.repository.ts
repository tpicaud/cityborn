import {
  PlayerIdSchema,
  type SessionId,
  SessionIdSchema,
  SessionSchema,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { z } from 'zod';
import type { SessionRepository, StoredSession } from './session.repository';

const SESSION_KEY_PREFIX: string = 'session:';
const SESSION_EXPIRATIONS_KEY: string = 'session-expirations';
const SESSION_TTL_SECONDS: number = 10 * 60;

const StoredSessionSchema: z.ZodType<StoredSession, z.ZodTypeDef, unknown> =
  z.object({
    session: SessionSchema,
    reconnectTokenHashes: z.record(PlayerIdSchema, z.string()),
    roundDeadline: z.number().nullable(),
  });

@Injectable()
export class RedisSessionRepository implements SessionRepository {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async find(id: SessionId): Promise<StoredSession | null> {
    const serializedStoredSession: string | null = await this.redisClient.get(
      `${SESSION_KEY_PREFIX}${id}`,
    );
    if (serializedStoredSession === null) return null;
    return StoredSessionSchema.parse(JSON.parse(serializedStoredSession));
  }

  async save(storedSession: StoredSession): Promise<void> {
    const results: [Error | null, unknown][] | null = await this.redisClient
      .multi()
      .set(
        `${SESSION_KEY_PREFIX}${storedSession.session.id}`,
        JSON.stringify(storedSession),
        'EX',
        SESSION_TTL_SECONDS,
      )
      .zadd(
        SESSION_EXPIRATIONS_KEY,
        Date.now() + SESSION_TTL_SECONDS * 1000,
        storedSession.session.id,
      )
      .exec();
    if (results === null) throw new Error('Session save transaction aborted');
    const commandError: Error | null =
      results.map(([error]) => error).find((error) => error !== null) ?? null;
    if (commandError) throw commandError;
  }

  async listActiveIds(): Promise<SessionId[]> {
    await this.redisClient.zremrangebyscore(
      SESSION_EXPIRATIONS_KEY,
      '-inf',
      Date.now(),
    );
    const sessionIds: string[] = await this.redisClient.zrange(
      SESSION_EXPIRATIONS_KEY,
      0,
      -1,
    );
    return sessionIds.map((sessionId) => SessionIdSchema.parse(sessionId));
  }
}
