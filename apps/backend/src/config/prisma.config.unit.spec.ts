import { parsePrismaEnvironmentConfig } from './prisma.config';

describe('parsePrismaEnvironmentConfig', () => {
  it('uses a CLI-safe default when no database is needed', () => {
    const config = parsePrismaEnvironmentConfig({});

    expect(config.directUrl).toBe('postgresql://localhost:5432/dummy');
  });

  it('rejects an invalid direct database URL', () => {
    expect(() =>
      parsePrismaEnvironmentConfig({ DIRECT_URL: 'invalid' }),
    ).toThrow();
  });
});
