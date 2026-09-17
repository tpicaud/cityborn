import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  appendFileSync,
  closeSync,
  copyFileSync,
  createReadStream,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

type Files = { input?: string; output?: string };
export type Database = (
  program: string,
  args: string[],
  files?: Files,
) => string;
const localImage = 'postgis/postgis:16-3.4';
const clientImage = 'public.ecr.aws/supabase/postgres:17.6.1.158';
const psqlArgs = ['-X', '-q', '-A', '-t', '--set=ON_ERROR_STOP=1'];
const say = (message: string) => process.stdout.write(`${message}\n`);
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;

function command(program: string, args: string[], files: Files = {}): string {
  const input = files.input ? openSync(files.input, 'r') : undefined;
  const output = files.output ? openSync(files.output, 'w', 0o600) : undefined;
  try {
    return (
      execFileSync(program, args, {
        encoding: 'utf8',
        stdio: [input ?? 'ignore', output ?? 'pipe', 'pipe'],
        maxBuffer: 16 * 1024 * 1024,
      })
        ?.toString()
        .trim() ?? ''
    );
  } finally {
    if (input !== undefined) closeSync(input);
    if (output !== undefined) closeSync(output);
  }
}

export function containerDatabase(
  container: string,
  database: string,
): Database {
  return (program, args, files) =>
    command(
      'docker',
      [
        'exec',
        '-i',
        container,
        program,
        '-U',
        'postgres',
        '-d',
        database,
        ...args,
      ],
      files,
    );
}

const objectsSql = `
SELECT CASE WHEN c.relkind = 'S' THEN 'SEQUENCE' ELSE 'TABLE' END AS kind,
  format('public.%I', c.relname) AS name, c.relowner AS owner,
  coalesce(c.relacl, acldefault(CASE WHEN c.relkind = 'S' THEN 'S'::"char" ELSE 'r'::"char" END, c.relowner)) AS acl
FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'S')
  AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e')
UNION ALL
SELECT 'TYPE', format('public.%I', t.typname), t.typowner, coalesce(t.typacl, acldefault('T', t.typowner))
FROM pg_type t WHERE t.typnamespace = 'public'::regnamespace AND t.typtype = 'e'
  AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid = 'pg_type'::regclass AND d.objid = t.oid AND d.deptype = 'e')`;

const supportedSql = `DO $supported$ BEGIN
  IF EXISTS (
    SELECT FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('v','m','f','p','c')
      AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.deptype = 'e' AND
        ((d.classid = 'pg_class'::regclass AND d.objid = c.oid) OR (d.classid = 'pg_type'::regclass AND d.objid = c.reltype)))
  ) OR EXISTS (
    SELECT FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
      AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e')
  ) OR EXISTS (
    SELECT FROM pg_type t WHERE t.typnamespace = 'public'::regnamespace AND t.typtype IN ('d','r','m')
      AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid = 'pg_type'::regclass AND d.objid = t.oid AND d.deptype = 'e')
  ) THEN RAISE EXCEPTION 'public contient des objets non pris en charge (vues, fonctions, partitions ou types complexes)'; END IF;
  IF EXISTS (SELECT FROM (${objectsSql}) o WHERE o.owner <> 'postgres'::regrole) THEN
    RAISE EXCEPTION 'Les objets applicatifs doivent appartenir au rôle postgres'; END IF;
END $supported$;`;

export function prepareReplacement(
  database: Database,
  directory: string,
  root: string,
): string {
  database('psql', [...psqlArgs, '-c', supportedSql]);
  database('psql', [
    ...psqlArgs,
    '-c',
    `DO $validate$ DECLARE fk record; BEGIN
    IF to_regclass('public."User"') IS NULL OR to_regclass('public."_prisma_migrations"') IS NULL THEN
      RAISE EXCEPTION 'Tables Cityborn absentes'; END IF;
    IF EXISTS (SELECT FROM public."_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL)
      OR NOT EXISTS (SELECT FROM public."_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) THEN
      RAISE EXCEPTION 'Historique Prisma incomplet'; END IF;
    FOR fk IN SELECT conrelid::regclass AS relation, conname, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace LOOP
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.relation, fk.conname);
      EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', fk.relation, fk.conname, fk.definition);
      EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', fk.relation, fk.conname);
    END LOOP;
  END $validate$;`,
  ]);
  const tables = database('psql', [
    ...psqlArgs,
    '-c',
    `SELECT name FROM (${objectsSql}) o WHERE kind = 'TABLE' ORDER BY name`,
  ]).split('\n');
  let assertions = '';
  for (const table of tables) {
    const count = database('psql', [
      ...psqlArgs,
      '-c',
      `SELECT count(*) FROM ${table}`,
    ]);
    say(`${table} : ${count}`);
    assertions += `IF (SELECT count(*) FROM ${table}) <> ${count} THEN RAISE EXCEPTION 'Comptage incorrect : %', ${literal(table)}; END IF;\n`;
  }
  const dump = join(directory, 'application.dump');
  database(
    'pg_dump',
    ['-Fc', '--schema=public', '--exclude-table=public.spatial_ref_sys'],
    { output: dump },
  );
  const docker = [
    'run',
    '--rm',
    '--network=none',
    '-v',
    `${directory}:/work`,
    '--entrypoint=pg_restore',
    localImage,
  ];
  const entries = command('docker', [
    ...docker,
    '--list',
    '/work/application.dump',
  ]);
  const selected = entries
    .split('\n')
    .filter(
      (line) =>
        !/ SCHEMA - public | (COMMENT|ACL) - SCHEMA public | DEFAULT ACL /.test(
          line,
        ),
    );
  writeFileSync(
    join(directory, 'application.list'),
    `${selected.join('\n')}\n`,
  );
  const replacement = join(directory, 'replacement.sql');
  command(
    'docker',
    [
      ...docker,
      '--no-owner',
      '--no-acl',
      '--file=-',
      '--use-list=/work/application.list',
      '/work/application.dump',
    ],
    { output: replacement },
  );
  const body = readFileSync(replacement, 'utf8');
  writeFileSync(
    replacement,
    `${supportedSql}\n${readFileSync(join(root, 'scripts/database-backup/replace-public.sql'), 'utf8')}\n${body}\n`,
  );
  appendFileSync(
    replacement,
    `SELECT DISTINCT format('REVOKE ALL ON %s %s FROM %s;', o.kind, o.name,
    CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(a.grantee)) END)
    FROM (${objectsSql}) o CROSS JOIN LATERAL aclexplode(o.acl) a WHERE a.grantee <> o.owner;\n\\gexec\n`,
  );
  appendFileSync(
    replacement,
    `${database('psql', [
      ...psqlArgs,
      '-c',
      `SELECT format('GRANT %s ON %s %s TO %s%s;', a.privilege_type, o.kind, o.name,
    CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(a.grantee)) END,
    CASE WHEN a.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END)
    FROM (${objectsSql}) o CROSS JOIN LATERAL aclexplode(o.acl) a
    UNION ALL
    SELECT format('GRANT %s (%I) ON TABLE public.%I TO %s%s;', a.privilege_type, att.attname, c.relname,
      CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(a.grantee)) END,
      CASE WHEN a.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END)
    FROM pg_attribute att JOIN pg_class c ON c.oid = att.attrelid
    CROSS JOIN LATERAL aclexplode(att.attacl) a
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
      AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e');`,
    ])}\n`,
  );
  appendFileSync(
    replacement,
    `DO $counts$ BEGIN ${assertions} END $counts$;\nNOTIFY pgrst, 'reload schema';\n`,
  );
  return replacement;
}

export function replaceDatabase(database: Database, replacement: string): void {
  database('psql', [...psqlArgs, '--single-transaction'], {
    input: replacement,
  });
}

async function checksum(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function adaptSql(source: string, output: string): Promise<void> {
  const lines = createInterface({
    input: createReadStream(source),
    crlfDelay: Infinity,
  });
  const descriptor = openSync(output, 'w', 0o600);
  let platformCopy = false;
  try {
    for await (const line of lines) {
      if (/^COPY "?(auth|storage)"?\./.test(line)) {
        platformCopy = true;
        continue;
      }
      if (platformCopy && line === '\\.') {
        platformCopy = false;
        continue;
      }
      if (platformCopy)
        throw new Error(
          'Données Auth/Storage non vides : restauration applicative impossible',
        );
      if (
        /^SET transaction_timeout/.test(line) ||
        /^SELECT pg_catalog\.setval.*"?(auth|storage)"?\./.test(line) ||
        /^CREATE EXTENSION IF NOT EXISTS "supabase_vault" /.test(line) ||
        /^ALTER PUBLICATION "supabase_realtime" OWNER/.test(line)
      )
        continue;
      appendFileSync(
        descriptor,
        `${line.replace(/^CREATE SCHEMA ("?public"?);$/, 'CREATE SCHEMA IF NOT EXISTS $1;')}\n`,
      );
    }
  } finally {
    closeSync(descriptor);
    lines.close();
  }
}

export async function restore(args: string[], root: string): Promise<void> {
  const [archiveArgument, flag, target] = args;
  if (
    !archiveArgument ||
    (args.length !== 1 &&
      (args.length !== 3 ||
        flag !== '--target' ||
        (target !== 'production' && target !== 'staging')))
  ) {
    throw new Error(
      'Usage : pnpm db:restore <archive.tar.gz> [--target production|staging]',
    );
  }
  process.umask(0o077);
  const archive = resolve(archiveArgument);
  const digest = await checksum(archive);
  const expected = readFileSync(`${archive}.sha256`, 'utf8')
    .trim()
    .match(/^([a-f0-9]{64})\s+\*?([^\r\n]+)$/i);
  if (
    !expected ||
    expected[1].toLowerCase() !== digest ||
    expected[2] !== basename(archive)
  )
    throw new Error('Checksum invalide ou nom du fichier différent');
  const entries = command('tar', ['-tzf', archive]).split('\n').sort();
  if (
    entries.join(',') !== 'data.sql,roles.sql,schema.sql' ||
    command('tar', ['-tvzf', archive])
      .split('\n')
      .some((line) => !line.startsWith('-'))
  )
    throw new Error(
      'Archive invalide : trois fichiers SQL ordinaires attendus',
    );
  say(`Archive vérifiée : ${basename(archive)} / SHA-256 ${digest}`);
  const directory = mkdtempSync(join(tmpdir(), 'cityborn-restore-'));
  const container = `cityborn-restore-${randomUUID()}`;
  let success = false;
  try {
    command('tar', ['-xzf', archive, '-C', directory]);
    await adaptSql(
      join(directory, 'schema.sql'),
      join(directory, 'schema.local.sql'),
    );
    await adaptSql(
      join(directory, 'data.sql'),
      join(directory, 'data.local.sql'),
    );
    say('Restauration dans un PostgreSQL jetable…');
    command('docker', [
      'run',
      '-d',
      '--name',
      container,
      '--network=none',
      '-e',
      'POSTGRES_HOST_AUTH_METHOD=trust',
      localImage,
    ]);
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        command('docker', [
          'exec',
          container,
          'pg_isready',
          '-h',
          '127.0.0.1',
          '-U',
          'postgres',
        ]);
        ready = true;
        break;
      } catch {
        await new Promise((resolveWait) => setTimeout(resolveWait, 500));
      }
    }
    if (!ready) throw new Error('PostgreSQL jetable indisponible');
    command('docker', [
      'exec',
      container,
      'createdb',
      '-U',
      'postgres',
      'restore',
    ]);
    const local = containerDatabase(container, 'restore');
    local('psql', [
      ...psqlArgs,
      '-c',
      `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE authenticator;
      CREATE ROLE service_role; CREATE ROLE supabase_admin; CREATE SCHEMA extensions;
      CREATE SCHEMA IF NOT EXISTS tiger; CREATE SCHEMA IF NOT EXISTS topology;`,
    ]);
    local('psql', [...psqlArgs], { input: join(directory, 'roles.sql') });
    local('psql', [...psqlArgs], {
      input: join(directory, 'schema.local.sql'),
    });
    const data = join(directory, 'data.local.sql');
    writeFileSync(
      data,
      `SET session_replication_role = replica;\n${readFileSync(data, 'utf8')}`,
    );
    local('psql', [...psqlArgs, '--single-transaction'], { input: data });
    const replacement = prepareReplacement(local, directory, root);
    if (!target) {
      say('Contrôle à blanc réussi. Aucune connexion distante.');
      success = true;
      return;
    }

    const configuration =
      target === 'staging'
        ? {
            dbUrl: process.env.RESTORE_STAGING_DB_URL,
            ca: process.env.RESTORE_STAGING_SSL_ROOT_CERT,
            project: process.env.RESTORE_STAGING_PROJECT_REF,
          }
        : {
            dbUrl: process.env.RESTORE_PRODUCTION_DB_URL,
            ca: process.env.RESTORE_PRODUCTION_SSL_ROOT_CERT,
            project: process.env.RESTORE_PRODUCTION_PROJECT_REF,
          };
    const { ca, project } = configuration;
    const url = new URL(configuration.dbUrl ?? '');
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !ca ||
      !project ||
      (url.hostname !== `db.${project}.supabase.co` &&
        !(
          url.hostname.endsWith('.pooler.supabase.com') &&
          decodeURIComponent(url.username) === `postgres.${project}`
        )) ||
      url.search ||
      (url.port && url.port !== '5432') ||
      url.pathname !== '/postgres'
    )
      throw new Error(
        `Configuration ${target} invalide : URL Supabase directe/session (5432), projet attendu et certificat requis`,
      );
    copyFileSync(ca, join(directory, 'root.crt'));
    const environment = {
      PGHOST: url.hostname,
      PGPORT: url.port || '5432',
      PGDATABASE: 'postgres',
      PGUSER: decodeURIComponent(url.username),
      PGPASSWORD: decodeURIComponent(url.password),
      PGSSLMODE: 'verify-full',
      PGSSLROOTCERT: '/work/root.crt',
      PGCONNECT_TIMEOUT: '15',
    };
    if (Object.values(environment).some((value) => /[\r\n]/.test(value)))
      throw new Error('Configuration PostgreSQL invalide');
    writeFileSync(
      join(directory, 'connection.env'),
      Object.entries(environment)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n'),
    );
    const remote: Database = (program, parameters, files) =>
      command(
        'docker',
        [
          'run',
          '--rm',
          '-i',
          '--env-file',
          join(directory, 'connection.env'),
          '-v',
          `${directory}:/work:ro`,
          `--entrypoint=${program}`,
          clientImage,
          ...parameters,
        ],
        files,
      );
    const identity = remote('psql', [
      ...psqlArgs,
      '-c',
      "SELECT current_database() || ' / ' || current_user || ' / PostgreSQL ' || current_setting('server_version')",
    ]);
    say(`Cible ${target} : ${project} / ${url.hostname} / ${identity}`);
    remote('psql', [...psqlArgs, '-c', supportedSql]);
    const safety = join(
      root,
      '.restore-safety',
      `${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}`,
    );
    mkdirSync(safety, { recursive: true });
    const before = join(safety, 'before.dump');
    remote('pg_dump', ['-Fc', '--schema=public'], { output: before });
    writeFileSync(
      `${before}.sha256`,
      `${await checksum(before)}  before.dump\n`,
    );
    writeFileSync(
      join(safety, 'identity.txt'),
      `${target} / ${project} / ${url.hostname} / ${identity}\nBackup choisi : ${basename(archive)}\nSHA-256 : ${digest}\n`,
    );
    say(`Sauvegarde de sécurité conservée : ${safety}`);
    say(
      'Arrêter les écritures, workers et migrations. Les données postérieures au backup seront perdues.',
    );
    const confirmation = `RESTORE ${target} ${project} ${basename(archive)}`;
    const prompt = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    try {
      if (
        (await prompt.question(`Saisir exactement « ${confirmation} » : `)) !==
        confirmation
      )
        throw new Error('Restauration annulée');
    } finally {
      prompt.close();
    }
    replaceDatabase(remote, replacement);
    say(
      'Restauration validée et transaction commitée. Vérifier l’application avant la reprise des écritures.',
    );
    success = true;
  } catch (error) {
    writeFileSync(
      join(directory, 'error.log'),
      error instanceof Error ? error.message : String(error),
    );
    throw new Error(
      `Échec : détails locaux dans ${join(directory, 'error.log')}. La sauvegarde de sécurité, si créée, est conservée.`,
    );
  } finally {
    try {
      command('docker', ['rm', '-f', '-v', container]);
    } catch {
      /* Le conteneur peut ne pas avoir été créé. */
    }
    rmSync(join(directory, 'connection.env'), { force: true });
    if (success) rmSync(directory, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await restore(
      process.argv.slice(2),
      fileURLToPath(new URL('../../', import.meta.url)),
    );
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : 'Restauration interrompue',
    );
    process.exitCode = 1;
  }
}
