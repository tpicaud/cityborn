import {
  execFileSync,
  type SpawnSyncReturns,
  spawnSync,
} from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';

describe('User email migration', () => {
  const container: string = `cityborn-email-migration-${randomUUID()}`;
  const migration: string = readFileSync(
    resolve(
      __dirname,
      '../../prisma/migrations/20261114181545_user_email_case_insensitive/migration.sql',
    ),
    'utf8',
  );
  const psqlArgs: string[] = [
    'exec',
    '-i',
    container,
    'psql',
    '-X',
    '-q',
    '-A',
    '-t',
    '-U',
    'postgres',
    '--set=ON_ERROR_STOP=1',
  ];

  function query(sql: string): string {
    return execFileSync('docker', psqlArgs, {
      input: sql,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  }

  async function waitForPostgres(attempts: number): Promise<void> {
    const result: SpawnSyncReturns<string> = spawnSync(
      'docker',
      ['exec', container, 'pg_isready', '-U', 'postgres'],
      { encoding: 'utf8' },
    );
    if (result.status === 0) return;
    if (attempts === 0)
      throw new Error('Migration test PostgreSQL did not become ready');
    await setTimeout(250);
    await waitForPostgres(attempts - 1);
  }

  beforeAll(async () => {
    execFileSync(
      'docker',
      [
        'run',
        '--detach',
        '--name',
        container,
        '--env',
        'POSTGRES_HOST_AUTH_METHOD=trust',
        'postgres:16-alpine',
      ],
      { stdio: 'pipe' },
    );
    await waitForPostgres(120);
  }, 120_000);

  beforeEach(() => {
    query(`DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      CREATE TABLE "User" (id uuid PRIMARY KEY, email text NOT NULL UNIQUE);
      CREATE TABLE "Progress" ("userId" uuid REFERENCES "User" (id), score integer);
      INSERT INTO "User" VALUES ('00000000-0000-4000-8000-000000000001', 'Alice@Example.com');
      INSERT INTO "Progress" VALUES ('00000000-0000-4000-8000-000000000001', 42);`);
  });

  afterAll(() => {
    execFileSync('docker', ['rm', '--force', container], { stdio: 'pipe' });
  });

  it('installs citext and preserves account data while enforcing case-insensitive uniqueness', () => {
    query(migration);

    expect(
      query(
        `SELECT email, score FROM "User" JOIN "Progress" ON id = "userId" WHERE email = 'ALICE@EXAMPLE.COM';`,
      ),
    ).toBe('Alice@Example.com|42');
    expect(
      query(
        `SELECT udt_schema, udt_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'email';`,
      ),
    ).toBe('public|citext');
    const duplicate: SpawnSyncReturns<string> = spawnSync('docker', psqlArgs, {
      input: `INSERT INTO "User" VALUES ('00000000-0000-4000-8000-000000000002', 'alice@example.com');`,
      encoding: 'utf8',
    });
    expect(duplicate.status).not.toBe(0);
    expect(duplicate.stderr).toContain('User_email_key');
  });

  it('reports all colliding accounts and rolls back without selecting or merging an account', () => {
    query(
      `INSERT INTO "User" VALUES ('00000000-0000-4000-8000-000000000002', 'ALICE@EXAMPLE.COM');`,
    );

    const result: SpawnSyncReturns<string> = spawnSync('docker', psqlArgs, {
      input: migration,
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Case-insensitive email collisions prevent migration',
    );
    expect(result.stderr).toContain('alice@example.com');
    expect(result.stderr).toContain('00000000-0000-4000-8000-000000000001');
    expect(result.stderr).toContain('00000000-0000-4000-8000-000000000002');
    expect(query(`SELECT email FROM "User" ORDER BY id;`)).toBe(
      'Alice@Example.com\nALICE@EXAMPLE.COM',
    );
    expect(query(`SELECT score FROM "Progress";`)).toBe('42');
    expect(
      query(
        `SELECT udt_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'email';`,
      ),
    ).toBe('text');
    expect(
      query(`SELECT count(*) FROM pg_extension WHERE extname = 'citext';`),
    ).toBe('0');
  });
});
