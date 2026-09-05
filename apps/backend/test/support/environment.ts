export const testDatabaseUrl =
  'postgresql://cityborn_test:cityborn_test@localhost:5433/cityborn_test';
export const testRedisUrl = 'redis://localhost:6380/0';

export function configureTestEnvironment() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.DIRECT_URL = testDatabaseUrl;
  process.env.REDIS_URL = testRedisUrl;
}
