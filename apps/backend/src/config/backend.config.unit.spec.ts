import { parseBackendConfig } from './backend.config';

const validEnvironment: NodeJS.ProcessEnv = {
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  GOOGLE_CLIENT_ID: 'google-client',
  APP_ID: 'cityborn-app',
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
      corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
      backOfficeOrigin: 'http://localhost:3001',
      frontendUrl: 'http://localhost:3000',
    });
    expect(config.mail.senderName).toBe('Cityborn');
    expect(config.logger.level).toBe('info');
    expect(config.session).toEqual({ playerDisconnectGracePeriodMs: 30_000 });
  });

  it('parses numbers and URL lists', () => {
    const environment: NodeJS.ProcessEnv = {
      ...validEnvironment,
      PORT: '4100',
      CORS_ORIGIN: 'https://cityborn.test, https://admin.cityborn.test',
      SESSION_PLAYER_DISCONNECT_GRACE_PERIOD_MS: '5000',
    };

    const config = parseBackendConfig(environment);

    expect(config.runtime.port).toBe(4100);
    expect(config.session.playerDisconnectGracePeriodMs).toBe(5_000);
    expect(config.http.corsOrigins).toEqual([
      'https://cityborn.test',
      'https://admin.cityborn.test',
      'http://localhost:3001',
    ]);
  });

  it('allows the back-office origin once in the CORS origins', () => {
    const environment: NodeJS.ProcessEnv = {
      ...validEnvironment,
      CORS_ORIGIN: 'https://cityborn.test,https://admin.cityborn.test',
      BACK_OFFICE_ORIGIN: 'https://admin.cityborn.test',
    };

    const config = parseBackendConfig(environment);

    expect(config.http.corsOrigins).toEqual([
      'https://cityborn.test',
      'https://admin.cityborn.test',
    ]);
    expect(config.http.backOfficeOrigin).toBe('https://admin.cityborn.test');
  });

  it('requires explicit browser origins in production', () => {
    const environment: NodeJS.ProcessEnv = {
      ...validEnvironment,
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://cityborn.test',
    };

    expect(() => parseBackendConfig(environment)).toThrow('BACK_OFFICE_ORIGIN');
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
