import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  lstatSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { rootCertificates } from 'node:tls';
import { fileURLToPath } from 'node:url';
import {
  applicationToc,
  backupKey,
  buildApplicationSql,
  latestBackup,
  listBackups,
  parseConnection,
  parseOptions,
  selectBackup,
  validateRootCertificate,
  verifyChecksum,
} from './restore.mts';

const name = 'cityborn-postgres-20260906T162920Z.tar.gz';
const ref = 'abcdefghijklmnopqrst';
const scripts = dirname(fileURLToPath(import.meta.url));

test('le certificat CA doit être valide, sans accepter un fichier arbitraire', () => {
  const validCertificate = rootCertificates.find((certificate) => {
    try {
      validateRootCertificate(certificate);
      return true;
    } catch {
      return false;
    }
  });
  assert.ok(validCertificate);
  assert.equal(validateRootCertificate(validCertificate), validCertificate);
  assert.throws(() => validateRootCertificate('not a certificate'));
  assert.throws(() => validateRootCertificate('-----BEGIN PRIVATE KEY-----'));
});

test('la cible par défaut est locale ; les options inconnues sont refusées', () => {
  assert.equal(parseOptions([name]).target, 'local');
  assert.equal(
    parseOptions([name, '--target', 'staging', '--check-only']).checkOnly,
    true,
  );
  assert.throws(() => parseOptions([name, '--target', 'prod']));
  assert.throws(() => parseOptions([name, '--yes']));
  assert.equal(parseOptions([]).backup, undefined);
  assert.equal(parseOptions([]).category, undefined);
  assert.equal(parseOptions(['--target', 'staging']).backup, undefined);
  assert.equal(parseOptions(['--kind', 'weekly']).category, 'weekly');
});

test('le menu propose les 18 backups de toutes les catégories et restitue le choix exact', async () => {
  const categories = ['daily', 'weekly', 'pre-migration'];
  const keys = Array.from({ length: 18 }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return `cityborn/${categories[index % categories.length]}/2026/09/${day}/cityborn-postgres-202609${day}T120000Z.tar.gz`;
  });
  const backups = listBackups(
    keys.flatMap((key) => [key, `${key}.sha256`]),
    undefined,
    'cityborn',
  );
  assert.equal(backups.length, 18);
  assert.equal(backups[0].key, keys[17]);
  assert.equal(backups[17].key, keys[0]);
  const messages: string[] = [];
  const selected = await selectBackup(
    backups,
    async () => '18',
    (message) => messages.push(message),
  );
  assert.equal(selected, keys[0]);
  for (const key of keys) assert.ok(messages.join('\n').includes(key));
  assert.equal(listBackups(keys, 'weekly', 'cityborn').length, 6);
});

test('le choix est obligatoire ; un numéro invalide ou un backup incomplet redemande une sélection', async () => {
  const backups = [
    { key: 'incomplete', complete: false },
    { key: 'selected', complete: true },
  ];
  const answers = ['', '0', '3', '1.5', '2abc', '1', '2'];
  let promptCount = 0;
  const messages: string[] = [];
  const selected = await selectBackup(
    backups,
    async () => {
      promptCount++;
      const answer = answers.shift();
      assert.notEqual(answer, undefined);
      return answer ?? '';
    },
    (message) => messages.push(message),
  );
  assert.equal(selected, 'selected');
  assert.equal(promptCount, 7);
  assert.ok(
    messages.some((message) => message.includes('Ce backup est incomplet')),
  );
});

test('annuler ou ne disposer d’aucun backup complet interrompt le choix', async () => {
  const backups = [{ key: 'backup', complete: true }];
  const display = () => {};
  await assert.rejects(
    selectBackup(backups, async () => 'q', display),
    /annulée/,
  );
  const unexpectedPrompt = async () => {
    assert.fail('Aucun choix ne doit être demandé sans backup complet.');
  };
  await assert.rejects(
    selectBackup([], unexpectedPrompt, display),
    /Aucun backup disponible/,
  );
  await assert.rejects(
    selectBackup(
      [{ key: 'backup', complete: false }],
      unexpectedPrompt,
      display,
    ),
    /Aucun backup complet/,
  );
});

test('la clé B2 est exacte et refuse les traversées', () => {
  assert.equal(
    backupKey(name, 'daily', 'cityborn'),
    `cityborn/daily/2026/09/06/${name}`,
  );
  assert.equal(
    backupKey(name, 'weekly', 'cityborn'),
    `cityborn/weekly/2026/09/06/${name}`,
  );
  assert.equal(
    backupKey(`cityborn/weekly/2026/09/06/${name}`, 'daily', 'cityborn'),
    `cityborn/weekly/2026/09/06/${name}`,
  );
  for (const invalid of [
    `../${name}`,
    `other/daily/2026/09/06/${name}`,
    'latest',
    name.replace('20260906', '20260231'),
  ]) {
    assert.throws(() => backupKey(invalid, 'daily', 'cityborn'));
  }
  assert.throws(() => backupKey(name, 'daily', '../cityborn'));
});

test('latest sélectionne la date du backup, dans la catégorie demandée, et refuse une paire incomplète', () => {
  const older = `cityborn/daily/2026/09/06/${name}`;
  const newer = older
    .replaceAll('2026/09/06', '2026/09/15')
    .replaceAll('20260906', '20260915');
  const otherCategory = newer.replace('/daily/', '/weekly/');
  const keys = [
    newer,
    `${older}.sha256`,
    otherCategory,
    `${otherCategory}.sha256`,
    older,
    'unrelated/file',
  ];
  assert.equal(parseOptions(['latest']).backup, 'latest');
  assert.equal(
    latestBackup(
      listBackups([...keys, `${newer}.sha256`], 'daily', 'cityborn'),
    ),
    newer,
  );
  assert.throws(
    () => latestBackup(listBackups(keys, 'daily', 'cityborn')),
    /incomplet/,
  );
  assert.throws(
    () => latestBackup(listBackups([], 'daily', 'cityborn')),
    /Aucun backup/,
  );
  assert.throws(
    () => listBackups([{ Key: newer }], 'daily', 'cityborn'),
    /invalide/,
  );
});

test('la connexion impose identité Supabase, session 5432 et paramètres sûrs', () => {
  const pooler = `postgresql://postgres.${ref}:p%3Aa%5Css@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;
  assert.equal(parseConnection(pooler, ref).password, 'p:a\\ss');
  assert.equal(
    parseConnection(
      `postgresql://postgres:secret@db.${ref}.supabase.co/postgres`,
      ref,
    ).project,
    ref,
  );
  for (const invalid of [
    pooler.replace(':5432', ':6543'),
    pooler.replace(ref, 'aaaaaaaaaaaaaaaaaaaa'),
    `${pooler}?sslmode=disable`,
    `${pooler}?options=evil`,
    pooler.replace('/postgres', '/other'),
    pooler.replace('pooler.supabase.com', 'example.com'),
    pooler.replace('p%3Aa%5Css', ''),
  ])
    assert.throws(() => parseConnection(invalid, ref));
});

test('le contrôle SHA-256 refuse corruption, mauvais nom et checksum multi-fichiers', () => {
  const archive = Buffer.from('backup');
  const checksum = createHash('sha256').update(archive).digest('hex');
  assert.equal(
    verifyChecksum(archive, `${checksum}  ${name}\n`, name),
    checksum,
  );
  assert.throws(() =>
    verifyChecksum(Buffer.from('corrupt'), `${checksum}  ${name}\n`, name),
  );
  assert.throws(() =>
    verifyChecksum(archive, `${checksum}  ../${name}\n`, name),
  );
  assert.throws(() =>
    verifyChecksum(archive, `${checksum}  ${name}\n${checksum}  other\n`, name),
  );
});

test('l’export applicatif exclut la création du schéma et refuse les objets globaux', () => {
  const rows = [
    '1; 0 0 SCHEMA - public postgres',
    '2; 0 0 ACL - SCHEMA public postgres',
    '3; 0 0 TABLE DATA public _prisma_migrations postgres',
  ];
  assert.equal(applicationToc(rows.join('\n')), `${rows[2]}\n`);
  for (const entry of [
    'FUNCTION public danger() postgres',
    'TABLE auth users postgres',
    'EXTENSION - postgis postgres',
    'PUBLICATION - supabase_realtime postgres',
  ]) {
    assert.throws(() => applicationToc(`${rows[2]}\n4; 0 0 ${entry}`));
  }
  assert.throws(() => applicationToc('1; 0 0 TABLE DATA public User postgres'));
});

test('restauration transactionnelle dans une base existante (Docker jetable)', {
  skip: process.env.CITYBORN_RESTORE_INTEGRATION !== '1',
  timeout: 180_000,
}, async (context) => {
  const directory = mkdtempSync(join(tmpdir(), 'cityborn-restore-tests-'));
  const sessionId = `restore-${randomUUID().slice(0, 6)}`;
  const container = `cityborn-${sessionId}`;
  const docker = (args: string[], input?: string | Buffer) =>
    spawnSync('docker', args, { input, maxBuffer: 64 * 1024 * 1024 });
  const run = (args: string[], input?: string | Buffer) => {
    const result = docker(args, input);
    assert.equal(result.status, 0, result.stderr?.toString());
    return result.stdout.toString().trim();
  };
  const sql = (database: string, input: string, transaction = false) =>
    docker(
      [
        'exec',
        '-i',
        container,
        'psql',
        '-X',
        '-U',
        'postgres',
        '-d',
        database,
        '-Atq',
        '-v',
        'ON_ERROR_STOP=1',
        ...(transaction ? ['-1', '-f', '-'] : []),
      ],
      input,
    );
  const query = (database: string, input: string) => {
    const result = sql(database, input);
    assert.equal(result.status, 0, result.stderr.toString());
    return result.stdout.toString().trim();
  };
  try {
    run([
      'run',
      '-d',
      '--name',
      container,
      '--label',
      `com.cityborn.restore.session=${sessionId}`,
      '--network',
      'none',
      '-e',
      'POSTGRES_HOST_AUTH_METHOD=trust',
      'postgis/postgis:16-3.4',
    ]);
    for (let attempt = 0; attempt < 60; attempt++) {
      if (
        docker([
          'exec',
          container,
          'pg_isready',
          '-h',
          '127.0.0.1',
          '-U',
          'postgres',
        ]).status === 0
      )
        break;
      await setTimeout(1000);
    }
    run(['exec', container, 'createdb', '-U', 'postgres', 'reference']);
    run(['exec', container, 'createdb', '-U', 'postgres', 'target']);
    query(
      'postgres',
      'CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;',
    );
    const fixture = `CREATE EXTENSION IF NOT EXISTS postgis;
      CREATE TYPE public.status AS ENUM ('old', 'new');
      CREATE TABLE public."User" (id serial PRIMARY KEY, value text, status public.status);
      CREATE TABLE public.child (id int PRIMARY KEY, user_id int REFERENCES public."User");
      CREATE TABLE public."_prisma_migrations" (migration_name text, finished_at timestamptz, rolled_back_at timestamptz);
      INSERT INTO public."User" VALUES (1, 'backup', 'old');
      SELECT setval('public."User_id_seq"', 1);
      INSERT INTO public.child VALUES (1,1);
      INSERT INTO public."_prisma_migrations" VALUES ('older_migration', now(), NULL), ('resolved_failure', NULL, now());`;
    query('reference', fixture);
    query('reference', 'GRANT SELECT ON public."User" TO authenticated;');
    query(
      'reference',
      'ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY; CREATE POLICY read_user ON public."User" FOR SELECT TO authenticated USING (true);',
    );
    query(
      'target',
      `${fixture}\nUPDATE public."User" SET value='current'; CREATE TABLE public.extra(id int); CREATE SCHEMA auth; CREATE TABLE auth.preserved(id int); INSERT INTO auth.preserved VALUES(42);`,
    );
    query(
      'target',
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;',
    );
    const session = {
      id: sessionId,
      directory,
      container,
      database: 'reference',
      sourceKey: name,
      target: 'local',
      status: 'test',
    };
    const applicationPath = buildApplicationSql({
      ...session,
      target: 'local',
    });
    const application = readFileSync(applicationPath, 'utf8');
    const replacement = readFileSync(
      join(scripts, 'restore-public.sql'),
      'utf8',
    );
    const verification = readFileSync(
      join(scripts, 'verify-restored-database.sql'),
      'utf8',
    );

    await context.test(
      'archive SQL réelle : restauration locale, garde-fou Auth/Storage et refus d’écrasement',
      () => {
        const localDatabase = 'cityborn_restore_20260914_123456';
        writeFileSync(join(directory, 'roles.sql'), '');
        writeFileSync(
          join(directory, 'schema.sql'),
          `SET transaction_timeout = 0;\n${fixture.slice(0, fixture.indexOf('INSERT INTO'))}`,
        );
        const data = run([
          'exec',
          container,
          'pg_dump',
          '-U',
          'postgres',
          '-d',
          'reference',
          '--data-only',
          '--schema=public',
          '--exclude-table=public.spatial_ref_sys',
        ]);
        const pack = (platformRow = '') => {
          writeFileSync(
            join(directory, 'data.sql'),
            `${data}\nCOPY auth.users (id) FROM stdin;\n${platformRow}\\.\nCOPY "storage".objects (id) FROM stdin;\n\\.\n`,
          );
          assert.equal(
            spawnSync('tar', [
              '-czf',
              join(directory, name),
              '-C',
              directory,
              'roles.sql',
              'schema.sql',
              'data.sql',
            ]).status,
            0,
          );
          const checksum = createHash('sha256')
            .update(readFileSync(join(directory, name)))
            .digest('hex');
          writeFileSync(
            join(directory, `${name}.sha256`),
            `${checksum}  ${name}\n`,
          );
        };
        const restore = (database: string) =>
          spawnSync(
            'bash',
            [
              join(scripts, 'restore-local.sh'),
              join(directory, name),
              database,
            ],
            {
              env: {
                ...process.env,
                CITYBORN_RESTORE_CONTAINER: container,
                CITYBORN_RESTORE_SESSION: sessionId,
              },
            },
          );
        pack();
        const result = restore(localDatabase);
        assert.equal(result.status, 0, result.stderr.toString());
        assert.equal(
          query(localDatabase, 'SELECT value FROM public."User"'),
          'backup',
        );
        assert.match(
          restore(localDatabase).stderr.toString(),
          /already exists/,
        );
        pack('a-user\n');
        assert.match(
          restore('cityborn_restore_20260914_123457').stderr.toString(),
          /cannot skip non-empty/,
        );
        assert.equal(
          query(
            'postgres',
            "SELECT count(*) FROM pg_database WHERE datname='cityborn_restore_20260914_123457';",
          ),
          '0',
        );
      },
    );

    await context.test(
      'précontrôle en lecture seule : aucune table supprimée',
      () => {
        const result = sql(
          'target',
          `BEGIN READ ONLY; SET LOCAL cityborn.restore_check_only='on';\n${replacement}\nROLLBACK;`,
        );
        assert.equal(result.status, 0, result.stderr.toString());
        assert.equal(
          query('target', 'SELECT value FROM public."User";'),
          'current',
        );
      },
    );

    await context.test(
      'échec SQL après suppression : les anciennes données restent intactes',
      () => {
        const result = sql(
          'target',
          `${replacement}\n${application}\nSELECT 1/0;`,
          true,
        );
        assert.notEqual(result.status, 0);
        assert.match(result.stderr.toString(), /division by zero/);
        assert.equal(
          query('target', 'SELECT value FROM public."User";'),
          'current',
        );
        assert.equal(
          query('target', "SELECT to_regclass('public.extra') IS NOT NULL;"),
          't',
        );
      },
    );

    await context.test(
      'dépendance externe : RESTRICT bloque sans supprimer auth',
      () => {
        query(
          'target',
          'ALTER TABLE auth.preserved ADD COLUMN user_id int REFERENCES public."User";',
        );
        const result = sql('target', `${replacement}\n${application}`, true);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr.toString(), /other objects depend/);
        assert.equal(
          query('target', 'SELECT value FROM public."User";'),
          'current',
        );
        assert.equal(query('target', 'SELECT id FROM auth.preserved;'), '42');
        query('target', 'ALTER TABLE auth.preserved DROP COLUMN user_id;');
      },
    );

    await context.test(
      'succès : anciens objets remplacés, extensions et schéma auth conservés',
      () => {
        const result = sql(
          'target',
          `${replacement}\n${application}\n${verification}`,
          true,
        );
        assert.equal(result.status, 0, result.stderr.toString());
        assert.equal(
          query('target', 'SELECT value FROM public."User";'),
          'backup',
        );
        assert.equal(
          query('target', "SELECT to_regclass('public.extra') IS NULL;"),
          't',
        );
        assert.equal(query('target', 'SELECT id FROM auth.preserved;'), '42');
        assert.equal(
          query(
            'target',
            "SELECT count(*) FROM pg_extension WHERE extname='postgis';",
          ),
          '1',
        );
        assert.equal(
          query(
            'target',
            'INSERT INTO public."User"(value) VALUES (\'next\') RETURNING id;',
          ),
          '2',
        );
        assert.equal(
          query(
            'target',
            "SELECT has_table_privilege('anon','public.\"User\"','SELECT');",
          ),
          'f',
        );
        assert.equal(
          query(
            'target',
            "SELECT has_table_privilege('authenticated','public.\"User\"','SELECT');",
          ),
          't',
        );
        assert.equal(
          query(
            'target',
            "SELECT has_sequence_privilege('anon','public.\"User_id_seq\"','USAGE');",
          ),
          'f',
        );
        assert.equal(
          query(
            'target',
            'SELECT relrowsecurity FROM pg_class WHERE oid=\'public."User"\'::regclass;',
          ),
          't',
        );
        assert.equal(
          query(
            'target',
            "SELECT count(*) FROM pg_policies WHERE schemaname='public' AND policyname='read_user';",
          ),
          '1',
        );
      },
    );

    await context.test(
      'un SQL supérieur à 64 Mio est transmis par fichiers, en une transaction',
      () => {
        query(
          'reference',
          "CREATE TABLE public.large_payload (value text); INSERT INTO public.large_payload VALUES (repeat('x', 70 * 1024 * 1024));",
        );
        const largeDirectory = mkdtempSync(join(directory, 'large-'));
        const largeApplication = buildApplicationSql({
          ...session,
          directory: largeDirectory,
          target: 'local',
        });
        assert.ok(lstatSync(largeApplication).size > 64 * 1024 * 1024);
        writeFileSync(join(largeDirectory, 'replace.sql'), replacement);
        writeFileSync(join(largeDirectory, 'verify.sql'), verification);
        run(['cp', largeDirectory, `${container}:/tmp/large`]);
        run([
          'exec',
          '-i',
          container,
          'psql',
          '-X',
          '-U',
          'postgres',
          '-d',
          'target',
          '-1',
          '-v',
          'ON_ERROR_STOP=1',
          '-f',
          '/tmp/large/replace.sql',
          '-f',
          '/tmp/large/application.sql',
          '-f',
          '/tmp/large/verify.sql',
        ]);
        assert.equal(
          query('target', 'SELECT length(value) FROM public.large_payload;'),
          String(70 * 1024 * 1024),
        );
        query('reference', 'DROP TABLE public.large_payload;');
        query('target', 'DROP TABLE public.large_payload;');
      },
    );

    await context.test(
      'les contrôles trouvent une FK orpheline même désactivée à l’import',
      () => {
        query(
          'reference',
          'SET session_replication_role=replica; UPDATE public.child SET user_id=999;',
        );
        assert.notEqual(sql('reference', verification).status, 0);
      },
    );

    await context.test(
      'une migration inachevée bloque ; un historique ancien annulé est accepté',
      () => {
        query(
          'target',
          'INSERT INTO public."_prisma_migrations" VALUES (\'broken\', NULL, NULL);',
        );
        assert.notEqual(sql('target', verification).status, 0);
      },
    );

    await context.test(
      'vue applicative non gérée : refus avant remplacement',
      () => {
        query(
          'target',
          'CREATE VIEW public.user_view AS SELECT * FROM public."User";',
        );
        assert.notEqual(sql('target', replacement, true).status, 0);
        assert.equal(
          query(
            'target',
            "SELECT to_regclass('public.user_view') IS NOT NULL;",
          ),
          't',
        );
      },
    );
    await context.test(
      'le diagnostic identifie publications et event triggers en lecture seule',
      () => {
        query(
          'target',
          `CREATE PUBLICATION restore_diagnostic_publication FOR TABLE public."User";
CREATE SCHEMA restore_diagnostic;
CREATE FUNCTION restore_diagnostic.audit() RETURNS event_trigger LANGUAGE plpgsql AS $$ BEGIN END $$;
CREATE EVENT TRIGGER restore_diagnostic_trigger ON ddl_command_end EXECUTE FUNCTION restore_diagnostic.audit();`,
        );
        try {
          const diagnostic: unknown = JSON.parse(
            query(
              'target',
              readFileSync(join(scripts, 'diagnose-restoration.sql'), 'utf8'),
            ),
          );
          assert.deepEqual(diagnostic, {
            readOnly: 'on',
            publications: [
              {
                name: 'restore_diagnostic_publication',
                owner: 'postgres',
                allTables: false,
                publicSchema: false,
                publicTables: ['User'],
              },
            ],
            eventTriggers: [
              {
                name: 'restore_diagnostic_trigger',
                enabled: 'O',
                event: 'ddl_command_end',
                owner: 'postgres',
                functionSchema: 'restore_diagnostic',
                functionName: 'audit',
                functionOwner: 'postgres',
                functionOwnerSuperuser: true,
                tags: null,
              },
            ],
          });
          assert.equal(
            query('target', 'SELECT value FROM public."User";'),
            'backup',
          );
          assert.notEqual(
            sql(
              'target',
              `BEGIN READ ONLY; SET LOCAL cityborn.restore_check_only='on';\n${replacement}\nROLLBACK;`,
            ).status,
            0,
          );
        } finally {
          query(
            'target',
            'DROP EVENT TRIGGER restore_diagnostic_trigger; DROP FUNCTION restore_diagnostic.audit(); DROP SCHEMA restore_diagnostic; DROP PUBLICATION restore_diagnostic_publication;',
          );
        }
      },
    );

    await context.test(
      'les six triggers système Supabase et la publication vide permettent le remplacement',
      () => {
        run([
          'exec',
          container,
          'createdb',
          '-U',
          'postgres',
          'supabase_triggers',
        ]);
        const triggers = [
          {
            name: 'issue_graphql_placeholder',
            function: 'set_graphql_placeholder',
            event: 'sql_drop',
            tag: 'DROP EXTENSION',
          },
          {
            name: 'issue_pg_cron_access',
            function: 'grant_pg_cron_access',
            event: 'ddl_command_end',
            tag: 'CREATE EXTENSION',
          },
          {
            name: 'issue_pg_graphql_access',
            function: 'grant_pg_graphql_access',
            event: 'ddl_command_end',
            tag: 'CREATE FUNCTION',
          },
          {
            name: 'issue_pg_net_access',
            function: 'grant_pg_net_access',
            event: 'ddl_command_end',
            tag: 'CREATE EXTENSION',
          },
          {
            name: 'pgrst_ddl_watch',
            function: 'pgrst_ddl_watch',
            event: 'ddl_command_end',
            tag: null,
          },
          {
            name: 'pgrst_drop_watch',
            function: 'pgrst_drop_watch',
            event: 'sql_drop',
            tag: null,
          },
        ];
        query(
          'supabase_triggers',
          `${fixture}
UPDATE public."User" SET value = 'current';
CREATE SCHEMA extensions;
CREATE PUBLICATION supabase_realtime;
${triggers.map((trigger) => `CREATE FUNCTION extensions.${trigger.function}() RETURNS event_trigger LANGUAGE plpgsql AS $$ BEGIN ${trigger.tag ? "RAISE EXCEPTION 'Unexpected extension trigger execution';" : "NOTIFY pgrst, 'reload schema';"} END $$;`).join('\n')}
${triggers.map((trigger) => `CREATE EVENT TRIGGER ${trigger.name} ON ${trigger.event} ${trigger.tag ? `WHEN TAG IN ('${trigger.tag}')` : ''} EXECUTE FUNCTION extensions.${trigger.function}();`).join('\n')}`,
        );
        const before = query(
          'supabase_triggers',
          readFileSync(join(scripts, 'diagnose-restoration.sql'), 'utf8'),
        );
        const preflight = sql(
          'supabase_triggers',
          `BEGIN READ ONLY; SET LOCAL cityborn.restore_check_only='on';\n${replacement}\nROLLBACK;`,
        );
        assert.equal(preflight.status, 0, preflight.stderr.toString());
        assert.equal(
          query('supabase_triggers', 'SELECT value FROM public."User";'),
          'current',
        );
        const result = sql(
          'supabase_triggers',
          `${replacement}\n${application}\n${verification}`,
          true,
        );
        assert.equal(result.status, 0, result.stderr.toString());
        assert.equal(
          query('supabase_triggers', 'SELECT value FROM public."User";'),
          'backup',
        );
        assert.equal(
          query(
            'supabase_triggers',
            readFileSync(join(scripts, 'diagnose-restoration.sql'), 'utf8'),
          ),
          before,
        );
      },
    );

    await context.test(
      'le nom du trigger GraphQL ne suffit pas à autoriser une définition différente',
      () => {
        const variants = [
          'ALTER EVENT TRIGGER issue_pg_graphql_access RENAME TO custom_graphql_access;',
          'ALTER FUNCTION extensions.grant_pg_graphql_access() RENAME TO custom_graphql_access;',
          'CREATE SCHEMA custom; ALTER FUNCTION extensions.grant_pg_graphql_access() SET SCHEMA custom;',
          'ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO anon;',
          `DROP EVENT TRIGGER issue_pg_graphql_access; CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end EXECUTE FUNCTION extensions.grant_pg_graphql_access();`,
          `DROP EVENT TRIGGER issue_pg_graphql_access; CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end WHEN TAG IN ('CREATE FUNCTION', 'CREATE TABLE') EXECUTE FUNCTION extensions.grant_pg_graphql_access();`,
          `DROP EVENT TRIGGER issue_pg_graphql_access; CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_start WHEN TAG IN ('CREATE FUNCTION') EXECUTE FUNCTION extensions.grant_pg_graphql_access();`,
          `ALTER PUBLICATION supabase_realtime ADD TABLE public."User";`,
        ];
        for (const variant of variants) {
          const result = sql(
            'supabase_triggers',
            `${variant}\nSET LOCAL cityborn.restore_check_only='on';\n${replacement}\nROLLBACK;`,
            true,
          );
          assert.notEqual(result.status, 0, variant);
          assert.match(
            result.stderr.toString(),
            /Publication ou event trigger actif/,
            variant,
          );
          assert.equal(
            query('supabase_triggers', 'SELECT value FROM public."User";'),
            'backup',
          );
        }
      },
    );

    await context.test(
      'restauration avec un propriétaire non-superuser et le watcher PostgREST',
      () => {
        query(
          'target',
          `DROP VIEW public.user_view;
CREATE ROLE restore_test_admin SUPERUSER LOGIN;
CREATE SCHEMA extensions;
CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger LANGUAGE plpgsql AS $$ BEGIN NOTIFY pgrst, 'reload schema'; END $$;
ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO restore_test_admin;
CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end EXECUTE FUNCTION extensions.pgrst_ddl_watch();`,
        );
        run(
          [
            'exec',
            '-i',
            container,
            'psql',
            '-X',
            '-U',
            'restore_test_admin',
            '-d',
            'target',
            '-v',
            'ON_ERROR_STOP=1',
          ],
          `ALTER ROLE postgres RENAME TO bootstrap_admin;
CREATE ROLE postgres LOGIN;
ALTER DATABASE target OWNER TO postgres;
ALTER TABLE public."User" OWNER TO postgres;
ALTER TABLE public.child OWNER TO postgres;
ALTER TABLE public."_prisma_migrations" OWNER TO postgres;
ALTER TYPE public.status OWNER TO postgres;`,
        );
        const result = sql(
          'target',
          `${replacement}\n${application}\n${verification}`,
          true,
        );
        assert.equal(result.status, 0, result.stderr.toString());
        assert.equal(
          query('target', 'SELECT value FROM public."User"'),
          'backup',
        );
        assert.equal(
          query(
            'target',
            "SELECT count(*) FROM pg_event_trigger WHERE evtname='pgrst_ddl_watch'",
          ),
          '1',
        );
      },
    );
  } catch (error) {
    for (const file of readdirSync(directory).filter((file) =>
      file.startsWith('error-'),
    )) {
      process.stderr.write(readFileSync(join(directory, file), 'utf8'));
    }
    throw error;
  } finally {
    docker(['rm', '-f', '-v', container]);
    rmSync(directory, { recursive: true, force: true });
  }
});
