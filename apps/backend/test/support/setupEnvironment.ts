export const testDatabaseUrl =
  'postgresql://cityborn_test:cityborn_test@localhost:5433/cityborn_test';
export const testRedisUrl = 'redis://localhost:6380/0';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = testDatabaseUrl;
process.env.REDIS_URL = testRedisUrl;
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client';
process.env.APP_ID = 'test.cityborn.app';
process.env.ADMIN_DASHBOARD_TOKEN = 'test-admin-token';
process.env.BREVO_API_KEY = 'test-brevo-key';
process.env.BREVO_SENDER_EMAIL = 'noreply@cityborn.test';
