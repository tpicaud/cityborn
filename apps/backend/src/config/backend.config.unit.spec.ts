import { parseBackendConfig } from './backend.config';

const validEnvironment: NodeJS.ProcessEnv = {
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  GOOGLE_CLIENT_ID: 'google-client',
  APP_ID: 'cityborn-app',
  ADMIN_DASHBOARD_TOKEN: 'admin-token',
  DATABASE_URL: 'postgresql://localhost:5432/cityborn',
  REDIS_URL: 'redis://localhost:6379/0',
  BREVO_API_KEY: 'brevo-key',
  BREVO_SENDER_EMAIL: 'noreply@cityborn.test',
};

describe('parseBackendConfig', () => {
  it('parses structured values and applies defaults', () => {
    const config = parseBackendConfig(validEnvironment);

    expect(config.runtime).toEqual({
      nodeEnvironment: 'development',
      port: 3001,
    });
    expect(config.http).toEqual({
      corsOrigins: ['http://localhost:3000'],
      frontendUrl: 'http://localhost:3000',
    });
    expect(config.mail.senderName).toBe('Cityborn');
    expect(config.logger.level).toBe('info');
  });

  it('parses numbers and URL lists', () => {
    const environment: NodeJS.ProcessEnv = {
      ...validEnvironment,
      PORT: '4100',
      CORS_ORIGIN: 'https://cityborn.test, https://admin.cityborn.test',
    };

    const config = parseBackendConfig(environment);

    expect(config.runtime.port).toBe(4100);
    expect(config.http.corsOrigins).toEqual([
      'https://cityborn.test',
      'https://admin.cityborn.test',
    ]);
  });

  it('rejects missing required values', () => {
    const environment: NodeJS.ProcessEnv = { ...validEnvironment };
    delete environment.JWT_ACCESS_SECRET;

    expect(() => parseBackendConfig(environment)).toThrow();
  });

  it('rejects incomplete optional credential pairs', () => {
    const environment: NodeJS.ProcessEnv = {
      ...validEnvironment,
      AXIOM_TOKEN: 'axiom-token',
    };

    expect(() => parseBackendConfig(environment)).toThrow(
      'AXIOM_TOKEN and AXIOM_DATASET must be configured together',
    );
  });
});
