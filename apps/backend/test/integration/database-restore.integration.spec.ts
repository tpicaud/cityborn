import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  appendFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

jest.setTimeout(120_000);

describe('Database backup restoration', () => {
  const repositoryRoot = resolve(__dirname, '../../../..');
  const restoreScript = join(
    repositoryRoot,
    'scripts/database-backup/restore.mts',
  );
  const container = `cityborn-restore-test-${randomUUID()}`;
  const workingDirectory = mkdtempSync(
    join(tmpdir(), 'cityborn-restore-test-'),
  );
  const replacementSql = join(workingDirectory, 'replacement.sql');
  const psqlArgs = ['-X', '-q', '-A', '-t', '--set=ON_ERROR_STOP=1'];
  const docker = (...args: string[]) =>
    execFileSync('docker', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const queryDatabase = (database: 'source' | 'target', statement: string) =>
    docker(
      'exec',
      container,
      'psql',
      '-U',
      'postgres',
      '-d',
      database,
      ...psqlArgs,
      '-c',
      statement,
    );
  const queryTarget = (statement: string) => queryDatabase('target', statement);
  const runRestoreModule = (invocation: string, ...args: string[]) =>
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        invocation,
        pathToFileURL(restoreScript).href,
        ...args,
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  const replaceDatabase = (sqlFile: string) =>
    runRestoreModule(
      `
    const { containerDatabase, replaceDatabase } = await import(process.argv[1]);
    replaceDatabase(containerDatabase(process.argv[2], 'target'), process.argv[3]);
  `,
      container,
      sqlFile,
    );
  const runRestoreCli = (archive: string) =>
    execFileSync(process.execPath, [restoreScript, archive], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, RESTORE_PRODUCTION_DB_URL: 'invalid' },
    });
  const createArchive = (filename: string) => {
    writeFileSync(join(workingDirectory, 'roles.sql'), 'SELECT 1;\n');
    for (const [file, section] of [
      ['schema.sql', '--schema-only'],
      ['data.sql', '--data-only'],
    ]) {
      writeFileSync(
        join(workingDirectory, file),
        docker(
          'exec',
          container,
          'pg_dump',
          '-U',
          'postgres',
          '-d',
          'source',
          section,
          '--schema=public',
        ),
      );
    }
    const archive = join(workingDirectory, filename);
    execFileSync('tar', [
      '-czf',
      archive,
      '-C',
      workingDirectory,
      'roles.sql',
      'schema.sql',
      'data.sql',
    ]);
    writeFileSync(
      `${archive}.sha256`,
      `${createHash('sha256').update(readFileSync(archive)).digest('hex')}  ${basename(archive)}\n`,
    );
    return archive;
  };
  const fixtureSql = `
    CREATE TYPE public.mood AS ENUM ('happy', 'sad');
    CREATE TABLE public."User" (id serial PRIMARY KEY, name text NOT NULL, mood public.mood);
    CREATE TABLE public.child (id integer PRIMARY KEY, user_id integer REFERENCES public."User");
    CREATE TABLE public."_prisma_migrations" (finished_at timestamp, rolled_back_at timestamp);
    INSERT INTO public."_prisma_migrations" VALUES (now(), NULL);
    INSERT INTO public."User" (name, mood) VALUES ('backup', 'happy');
    INSERT INTO public.child VALUES (1, 1);
    GRANT SELECT ON public."User" TO anon;
    GRANT SELECT (name) ON public."User" TO authenticated;
    GRANT USAGE ON SEQUENCE public."User_id_seq" TO anon;
    ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
    CREATE POLICY reader ON public."User" FOR SELECT TO anon USING (true);
  `;

  beforeAll(async () => {
    docker(
      'run',
      '-d',
      '--name',
      container,
      '--network=none',
      '-e',
      'POSTGRES_HOST_AUTH_METHOD=trust',
      '-e',
      'POSTGRES_USER=test_admin',
      'postgis/postgis:16-3.4',
    );
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        docker(
          'exec',
          container,
          'pg_isready',
          '-h',
          '127.0.0.1',
          '-U',
          'test_admin',
        );
        ready = true;
        break;
      } catch {
        await new Promise((resolveWait) => setTimeout(resolveWait, 500));
      }
    }
    if (!ready) throw new Error('Disposable PostgreSQL unavailable');
    docker(
      'exec',
      container,
      'psql',
      '-U',
      'test_admin',
      '-d',
      'postgres',
      '-c',
      'CREATE ROLE postgres SUPERUSER LOGIN; CREATE ROLE anon; CREATE ROLE authenticated;',
    );
    docker('exec', container, 'createdb', '-U', 'postgres', 'source');
    queryDatabase('source', fixtureSql);
    runRestoreModule(
      `
      const { containerDatabase, prepareReplacement } = await import(process.argv[1]);
      prepareReplacement(containerDatabase(process.argv[2], 'source'), process.argv[3], process.argv[4]);
    `,
      container,
      workingDirectory,
      repositoryRoot,
    );
  });

  beforeEach(() => {
    docker(
      'exec',
      container,
      'dropdb',
      '-U',
      'postgres',
      '--if-exists',
      'target',
    );
    docker('exec', container, 'createdb', '-U', 'postgres', 'target');
    queryTarget(`${fixtureSql}
      UPDATE public."User" SET name = 'before';
      CREATE TABLE public.newer_table (id integer);
      ALTER TABLE public."User" ADD COLUMN newer_column text;
      CREATE EXTENSION postgis;
      CREATE SCHEMA untouched;
      CREATE TABLE untouched.marker (value text);
      INSERT INTO untouched.marker VALUES ('keep');
      REVOKE CREATE ON SCHEMA public FROM PUBLIC;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
    `);
  });

  afterAll(() => {
    try {
      docker('rm', '-f', '-v', container);
    } finally {
      rmSync(workingDirectory, { recursive: true, force: true });
    }
  });

  it('replaces application schema and data while preserving extensions and other schemas', () => {
    replaceDatabase(replacementSql);

    expect(queryTarget('SELECT name FROM public."User"')).toBe('backup');
    expect(
      queryTarget("SELECT to_regclass('public.newer_table') IS NULL"),
    ).toBe('t');
    expect(
      queryTarget(
        "SELECT count(*) FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'newer_column'",
      ),
    ).toBe('0');
    expect(
      queryTarget(
        `INSERT INTO public."User" (name) VALUES ('next') RETURNING id`,
      ),
    ).toBe('2');
    expect(queryTarget('SELECT count(*) > 0 FROM public.spatial_ref_sys')).toBe(
      't',
    );
    expect(queryTarget('SELECT value FROM untouched.marker')).toBe('keep');
  });

  it('restores backup permissions without inheriting broader target defaults', () => {
    replaceDatabase(replacementSql);

    expect(
      queryTarget(`SELECT
      has_table_privilege('anon', 'public."User"', 'SELECT'),
      has_table_privilege('authenticated', 'public."User"', 'INSERT'),
      has_table_privilege('authenticated', 'public."User"', 'SELECT'),
      has_column_privilege('authenticated', 'public."User"', 'name', 'SELECT'),
      has_sequence_privilege('anon', 'public."User_id_seq"', 'USAGE'),
      has_schema_privilege('anon', 'public', 'CREATE'),
      (SELECT relrowsecurity FROM pg_class WHERE oid = 'public."User"'::regclass),
      (SELECT count(*) FROM pg_policy WHERE polrelid = 'public."User"'::regclass)`),
    ).toBe('t|f|f|t|t|f|t|1');
  });

  it('rolls back schema data and permissions when SQL fails before commit', () => {
    const failingSql = join(workingDirectory, 'failing.sql');
    writeFileSync(failingSql, readFileSync(replacementSql));
    appendFileSync(failingSql, '\nSELECT 1 / 0;\n');

    expect(() => replaceDatabase(failingSql)).toThrow(/division by zero/);

    expect(queryTarget('SELECT name FROM public."User"')).toBe('before');
    expect(
      queryTarget("SELECT to_regclass('public.newer_table') IS NOT NULL"),
    ).toBe('t');
    expect(
      queryTarget(
        `SELECT has_table_privilege('anon', 'public."User"', 'SELECT')`,
      ),
    ).toBe('t');
  });

  it('rejects external dependencies without removing them', () => {
    queryTarget(
      'ALTER TABLE untouched.marker ADD COLUMN user_id integer REFERENCES public."User"',
    );

    expect(() => replaceDatabase(replacementSql)).toThrow(/depend/);

    expect(queryTarget('SELECT name FROM public."User"')).toBe('before');
    expect(queryTarget('SELECT value FROM untouched.marker')).toBe('keep');
  });

  it('restores with a non-superuser database owner', () => {
    queryTarget('ALTER ROLE postgres NOSUPERUSER;');

    try {
      replaceDatabase(replacementSql);

      expect(queryTarget('SELECT name FROM public."User"')).toBe('backup');
    } finally {
      docker(
        'exec',
        container,
        'psql',
        '-U',
        'test_admin',
        '-d',
        'target',
        '-c',
        'ALTER ROLE postgres SUPERUSER;',
      );
    }
  });

  it('rolls back replacement when a final row count differs', () => {
    const mismatchedSql = join(workingDirectory, 'mismatch.sql');
    writeFileSync(
      mismatchedSql,
      readFileSync(replacementSql, 'utf8').replace(
        'DO $counts$',
        'DELETE FROM public.child;\nDO $counts$',
      ),
    );

    expect(() => replaceDatabase(mismatchedSql)).toThrow(/Comptage incorrect/);

    expect(queryTarget('SELECT name FROM public."User"')).toBe('before');
    expect(queryTarget('SELECT count(*) FROM public.child')).toBe('1');
  });

  it('validates a local archive without loading a remote configuration', () => {
    const archive = createArchive('valid-backup.tar.gz');

    const output = runRestoreCli(archive);

    expect(output).toContain(
      'Contrôle à blanc réussi. Aucune connexion distante.',
    );
    expect(queryTarget('SELECT name FROM public."User"')).toBe('before');
  });

  it('rejects an archive when its checksum does not match', () => {
    const archive = createArchive('invalid-checksum.tar.gz');
    writeFileSync(
      `${archive}.sha256`,
      `${'0'.repeat(64)}  ${basename(archive)}\n`,
    );

    expect(() => runRestoreCli(archive)).toThrow(/Checksum invalide/);

    expect(queryTarget('SELECT name FROM public."User"')).toBe('before');
  });
});
