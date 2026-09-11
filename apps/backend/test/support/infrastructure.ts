import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { resetDb } from './resetDb';
import { testDatabaseUrl, testRedisUrl } from './setupEnvironment';

export function createTestInfrastructure() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: testDatabaseUrl }),
  });
  const redis = new Redis(testRedisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
  });

  return {
    prisma,
    redis,
    async reset() {
      await resetDb(prisma);
      await redis.flushdb();
    },
    async close() {
      redis.disconnect();
      await prisma.$disconnect();
    },
  };
}
