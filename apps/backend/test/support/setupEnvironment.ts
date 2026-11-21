import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type DotenvParseOutput, parse } from 'dotenv';

const backendEnvPath: string = resolve(__dirname, '../../.env');
const backendEnv: DotenvParseOutput = existsSync(backendEnvPath)
  ? parse(readFileSync(backendEnvPath))
  : {};

export const testDatabaseUrl: string =
  process.env.TEST_DATABASE_URL ??
  backendEnv.TEST_DATABASE_URL ??
  'postgresql://cityborn_test:cityborn_test@localhost:5432/cityborn_test';
export const testRedisUrl: string =
  process.env.TEST_REDIS_URL ??
  backendEnv.TEST_REDIS_URL ??
  'redis://localhost:6379/1';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = testDatabaseUrl;
process.env.REDIS_URL = testRedisUrl;
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.BACK_OFFICE_ORIGIN = 'http://localhost:3001';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client';
process.env.APP_ID = 'test.cityborn.app';
process.env.BREVO_API_KEY = 'test-brevo-key';
process.env.BREVO_SENDER_EMAIL = 'noreply@cityborn.test';
