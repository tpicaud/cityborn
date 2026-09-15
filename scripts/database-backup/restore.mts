import { spawnSync } from 'node:child_process';
import { createHash, randomUUID, X509Certificate } from 'node:crypto';
import {
  appendFileSync,
  chmodSync,
  closeSync,
  createReadStream,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../..');
const sessionsRoot = join(repositoryRoot, '.restore-sessions');
const safetyRoot = join(repositoryRoot, '.restore-safety');
const localImage = 'postgis/postgis:16-3.4';
const clientImage = 'public.ecr.aws/supabase/postgres:17.6.1.158';
const awsImage = 'amazon/aws-cli:2.36.10';
const ownershipLabel = 'com.cityborn.restore.session';
const archivePattern =
  /^cityborn-postgres-(\d{4})(\d{2})(\d{2})T(\d{6})Z\.tar\.gz$/;
const sessionPattern = /^restore-[a-zA-Z0-9]{6}$/;

type Target = 'local' | 'staging' | 'production';
type Category = 'daily' | 'weekly' | 'pre-migration';
export interface Options {
  backup?: string;
  target: Target;
  category?: Category;
  checkOnly: boolean;
}
interface Connection {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
  project: string;
}
interface BackupStore {
  bucket: string;
  endpoint: string;
  env: NodeJS.ProcessEnv;
}
export interface ListedBackup {
  key: string;
  complete: boolean;
}
export interface Session {
  id: string;
  directory: string;
  container: string;
  database: string;
  sourceKey: string;
  target: Target;
  status: string;
  checksum?: string;
  safetyBackup?: string;
}

function say(message: string) {
  process.stdout.write(`${message}\n`);
}

export function parseOptions(args: string[]): Options {
  const options: Options = {
    target: 'local',
    checkOnly: false,
  };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--target') {
      const value = args[++index];
      if (value !== 'local' && value !== 'staging' && value !== 'production') {
        throw new Error('Cible attendue : local, staging ou production.');
      }
      options.target = value;
      continue;
    }
    if (argument === '--kind') {
      const value = args[++index];
      if (
        value !== 'daily' &&
        value !== 'weekly' &&
        value !== 'pre-migration'
      ) {
        throw new Error('Catégorie attendue : daily, weekly ou pre-migration.');
      }
      options.category = value;
      continue;
    }
    if (argument === '--check-only') {
      options.checkOnly = true;
      continue;
    }
    if (!argument || argument.startsWith('-') || options.backup) {
      throw new Error('Arguments invalides. Utiliser --help.');
    }
    options.backup = argument;
  }
  return options;
}

export function backupKey(
  backup: string,
  category: Category,
  prefix: string,
): string {
  if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(prefix)) {
    throw new Error('Préfixe Backblaze invalide.');
  }
  const name = basename(backup);
  const match = archivePattern.exec(name);
  if (!match)
    throw new Error(
      'Nom de backup invalide : cityborn-postgres-YYYYMMDDTHHMMSSZ.tar.gz attendu.',
    );
  const [, year, month, day, time] = match;
  const iso = `${year}-${month}-${day}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}.000Z`;
  const parsedDate = new Date(iso);
  if (
    !Number.isFinite(parsedDate.getTime()) ||
    parsedDate.toISOString() !== iso
  ) {
    throw new Error('Date du backup invalide.');
  }
  const allowedKeys = ['daily', 'weekly', 'pre-migration'].map(
    (kind) => `${prefix}/${kind}/${year}/${month}/${day}/${name}`,
  );
  if (backup.includes('/')) {
    if (!allowedKeys.includes(backup))
      throw new Error('Clé Backblaze hors du préfixe ou du format autorisé.');
    return backup;
  }
  return `${prefix}/${category}/${year}/${month}/${day}/${name}`;
}

export function listBackups(
  response: unknown,
  category: Category | undefined,
  prefix: string,
): ListedBackup[] {
  if (
    !Array.isArray(response) ||
    !response.every((key) => typeof key === 'string')
  ) {
    throw new Error('Liste de fichiers B2 invalide.');
  }
  const keys = new Set<string>(response);
  return [...keys]
    .filter((key) => {
      if (category && !key.startsWith(`${prefix}/${category}/`)) return false;
      try {
        return backupKey(key, category ?? 'daily', prefix) === key;
      } catch {
        return false;
      }
    })
    .sort(
      (left, right) =>
        basename(right).localeCompare(basename(left)) ||
        left.localeCompare(right),
    )
    .map((key) => ({ key, complete: keys.has(`${key}.sha256`) }));
}

export async function selectBackup(
  backups: ListedBackup[],
  prompt: (label: string) => Promise<string> = ask,
  display: (message: string) => void = say,
): Promise<string> {
  if (!backups.length) throw new Error('Aucun backup disponible dans B2.');
  display(
    `${backups.length} backups disponibles, du plus récent au plus ancien :\n${backups
      .map(
        (backup, index) =>
          `${index + 1}. ${backup.key}${backup.complete ? '' : ' [SHA-256 absent : indisponible]'}`,
      )
      .join('\n')}`,
  );
  if (!backups.some((backup) => backup.complete))
    throw new Error('Aucun backup complet disponible dans B2.');
  while (true) {
    const answer = (
      await prompt(`Numéro du backup (1-${backups.length}, q pour annuler) : `)
    ).trim();
    if (answer.toLowerCase() === 'q')
      throw new Error('Sélection du backup annulée.');
    const index = Number(answer) - 1;
    const backup = backups[index];
    if (!/^[1-9]\d*$/.test(answer) || !Number.isSafeInteger(index) || !backup) {
      display('Saisir le numéro d’un backup affiché, ou q pour annuler.');
      continue;
    }
    if (!backup.complete) {
      display(
        'Ce backup est incomplet : son fichier SHA-256 est absent. Choisir un autre numéro ou annuler.',
      );
      continue;
    }
    return backup.key;
  }
}

export function latestBackup(backups: ListedBackup[]): string {
  const latest = backups[0];
  if (!latest)
    throw new Error('Aucun backup disponible dans cette catégorie B2.');
  if (!latest.complete) {
    throw new Error(
      `Dernier backup incomplet (SHA-256 absent) : ${latest.key}. Attendre la fin de l’envoi ou choisir explicitement un backup antérieur.`,
    );
  }
  return latest.key;
}

export function parseConnection(
  value: string,
  expectedProject: string,
): Connection {
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error();
    if (!/^[a-z0-9]{20}$/.test(expectedProject)) throw new Error();
    const user = decodeURIComponent(url.username);
    const direct =
      url.hostname === `db.${expectedProject}.supabase.co` &&
      user === 'postgres';
    const pooler =
      /^aws-[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname) &&
      user === `postgres.${expectedProject}`;
    if (!direct && !pooler) throw new Error();
    if (
      (url.port || '5432') !== '5432' ||
      url.pathname !== '/postgres' ||
      url.hash
    )
      throw new Error();
    for (const [key, parameter] of url.searchParams) {
      if (key !== 'sslmode' || !['require', 'verify-full'].includes(parameter))
        throw new Error();
    }
    const password = decodeURIComponent(url.password);
    if (!password || /[\r\n\0]/.test(password)) throw new Error();
    return {
      host: url.hostname,
      port: '5432',
      user,
      password,
      database: 'postgres',
      project: expectedProject,
    };
  } catch {
    throw new Error(
      'URL cible refusée : utiliser une connexion Supabase directe/session IPv4 sur 5432, vers postgres, correspondant exactement au project ref configuré.',
    );
  }
}

export function verifyChecksum(
  archive: Buffer,
  sidecar: string,
  name: string,
): string {
  return verifyChecksumValue(
    createHash('sha256').update(archive).digest('hex'),
    sidecar,
    name,
  );
}

function verifyChecksumValue(
  checksum: string,
  sidecar: string,
  name: string,
): string {
  const match = /^([a-fA-F0-9]{64}) [ *]([^\r\n]+)\r?\n?$/.exec(sidecar);
  if (!match || match[2] !== name || match[1].toLowerCase() !== checksum) {
    throw new Error(
      'Checksum SHA-256 invalide ou nom de fichier différent. Aucune restauration autorisée.',
    );
  }
  return checksum;
}

async function fileChecksum(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export function validateRootCertificate(value: string): string {
  try {
    if (
      value.length > 500_000 ||
      !value.trimStart().startsWith('-----BEGIN CERTIFICATE-----')
    )
      throw new Error();
    const certificate = new X509Certificate(value);
    if (!certificate.ca || Date.parse(certificate.validTo) <= Date.now())
      throw new Error();
    return value;
  } catch {
    throw new Error(
      'Certificat racine invalide ou expiré. Télécharger le certificat CA dans les paramètres Database de Supabase.',
    );
  }
}

export function applicationToc(toc: string): string {
  const lines = toc.split('\n').filter((line) => {
    if (!line || line.startsWith(';')) return false;
    const match = /^\d+; \d+ \d+ (.+)$/.exec(line);
    if (!match) throw new Error('Table des matières PostgreSQL invalide.');
    const entry = match[1];
    if (
      /^(SCHEMA - public |(?:ACL|COMMENT) - SCHEMA public |DEFAULT ACL public )/.test(
        entry,
      )
    )
      return false;
    if (/^(ENCODING|STDSTRINGS|SEARCHPATH) /.test(entry)) return true;
    if (
      !/^(TABLE DATA|TABLE|SEQUENCE SET|SEQUENCE OWNED BY|SEQUENCE|TYPE|DEFAULT|CONSTRAINT|FK CONSTRAINT|INDEX|TRIGGER|POLICY|ROW SECURITY|ACL|COMMENT) public /.test(
        entry,
      )
    ) {
      throw new Error(
        'Le backup contient des objets hors du périmètre pris en charge. Revue manuelle requise.',
      );
    }
    return true;
  });
  if (
    !lines.some((line) => / TABLE DATA public _prisma_migrations /.test(line))
  ) {
    throw new Error('Historique Prisma absent de l’archive applicative.');
  }
  return `${lines.join('\n')}\n`;
}

function privateFile(path: string, content: string | Buffer) {
  writeFileSync(path, content, { mode: 0o600, flag: 'wx' });
}

function saveSession(session: Session) {
  writeFileSync(
    join(session.directory, 'session.json'),
    JSON.stringify(session, null, 2),
    { mode: 0o600 },
  );
}

interface CommandOptions {
  input?: string | Buffer;
  inputFile?: string;
  output?: string;
  env?: NodeJS.ProcessEnv;
}

function command(
  session: Session,
  executable: string,
  args: string[],
  options: CommandOptions = {},
): Buffer {
  const inputDescriptor = options.inputFile
    ? openSync(options.inputFile, 'r')
    : undefined;
  const descriptor = options.output
    ? openSync(options.output, 'wx', 0o600)
    : undefined;
  try {
    const result = spawnSync(executable, args, {
      env: options.env ?? process.env,
      input: options.input,
      stdio: [inputDescriptor ?? 'pipe', descriptor ?? 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
      timeout: 30 * 60 * 1000,
    });
    if (result.error || result.status !== 0) {
      const log = join(session.directory, `error-${randomUUID()}.log`);
      privateFile(
        log,
        result.stderr ?? result.error?.message ?? 'Commande interrompue',
      );
      throw new Error(
        `${executable} a échoué. Détails locaux confidentiels : ${log}`,
      );
    }
    return result.stdout ?? Buffer.alloc(0);
  } finally {
    if (inputDescriptor !== undefined) closeSync(inputDescriptor);
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

function localCommand(
  session: Session,
  executable: string,
  args: string[],
  options: CommandOptions = {},
) {
  return command(
    session,
    'docker',
    ['exec', '-i', session.container, executable, ...args],
    options,
  );
}

function localSql(session: Session, sql: string) {
  return localCommand(
    session,
    'psql',
    [
      '-X',
      '-U',
      'postgres',
      '-d',
      session.database,
      '-Atq',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: sql },
  )
    .toString()
    .trim();
}

function remoteCommand(
  session: Session,
  connection: Connection,
  executable: string,
  args: string[],
  options: CommandOptions = {},
) {
  return command(
    session,
    'docker',
    [
      'run',
      '--rm',
      '-i',
      '--user',
      `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
      '--mount',
      `type=bind,source=${session.directory},target=/restore,readonly`,
      '-e',
      `PGHOST=${connection.host}`,
      '-e',
      `PGPORT=${connection.port}`,
      '-e',
      `PGUSER=${connection.user}`,
      '-e',
      'PGDATABASE=postgres',
      '-e',
      'PGPASSFILE=/restore/pgpass',
      '-e',
      'PGSSLMODE=verify-full',
      '-e',
      'PGSSLROOTCERT=/restore/root.crt',
      '-e',
      'PGCONNECT_TIMEOUT=15',
      '-e',
      'PGAPPNAME=cityborn-database-restore',
      '--entrypoint',
      executable,
      clientImage,
      ...args,
    ],
    options,
  );
}

function remoteSql(session: Session, connection: Connection, sql: string) {
  return remoteCommand(
    session,
    connection,
    'psql',
    ['-X', '-Atq', '-v', 'ON_ERROR_STOP=1'],
    { input: sql },
  )
    .toString()
    .trim();
}

async function ask(label: string, secret = false): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      'Un terminal interactif est requis pour les identifiants manquants et les confirmations.',
    );
  }
  if (!secret) {
    const prompt = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    try {
      return (await prompt.question(label)).trim();
    } finally {
      prompt.close();
    }
  }
  say(label);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolveSecret, reject) => {
    let value = '';
    const done = (error?: Error) => {
      process.stdin.off('data', read);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) {
        reject(error);
        return;
      }
      resolveSecret(value);
    };
    const read = (chunk: Buffer) => {
      for (const character of chunk.toString()) {
        if (character === '\u0003') {
          done(new Error('Annulé.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          done();
          return;
        }
        if (character === '\u007f') {
          value = value.slice(0, -1);
          continue;
        }
        if (character >= ' ') value += character;
      }
    };
    process.stdin.on('data', read);
  });
}

async function configuration(name: string, secret = false): Promise<string> {
  const value =
    process.env[name] ||
    (await ask(`${name}${secret ? ' (saisie masquée)' : ''} : `, secret));
  if (!value) throw new Error(`${name} est obligatoire.`);
  return value;
}

async function confirm(expected: string) {
  const answer = await ask(
    `Pour confirmer, saisir exactement « ${expected} » : `,
  );
  if (answer !== expected) throw new Error('Confirmation refusée.');
}

function createSession(target: Target, sourceKey: string): Session {
  mkdirSync(sessionsRoot, { recursive: true, mode: 0o700 });
  if (lstatSync(sessionsRoot).isSymbolicLink())
    throw new Error('Dossier de sessions symbolique refusé.');
  chmodSync(sessionsRoot, 0o700);
  const directory = mkdtempSync(join(sessionsRoot, 'restore-'));
  const id = basename(directory);
  const database = `cityborn_restore_${new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15)}`;
  const session = {
    id,
    directory,
    container: `cityborn-${id}`,
    database,
    target,
    sourceKey,
    status: 'preparing',
  };
  saveSession(session);
  return session;
}

async function backupStore(): Promise<BackupStore> {
  const bucket = await configuration('RESTORE_B2_BUCKET');
  const endpoint = await configuration('RESTORE_B2_ENDPOINT');
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]$/.test(bucket) ||
    !/^https:\/\/s3\.[a-z0-9-]+\.backblazeb2\.com$/.test(endpoint)
  ) {
    throw new Error('Bucket ou endpoint Backblaze invalide.');
  }
  const env = {
    ...process.env,
    AWS_ACCESS_KEY_ID: await configuration('RESTORE_B2_KEY_ID'),
    AWS_SECRET_ACCESS_KEY: await configuration(
      'RESTORE_B2_APPLICATION_KEY',
      true,
    ),
    AWS_DEFAULT_REGION: new URL(endpoint).hostname.split('.')[1],
    AWS_EC2_METADATA_DISABLED: 'true',
    AWS_PAGER: '',
  };
  return { bucket, endpoint, env };
}

function b2Command(session: Session, store: BackupStore, args: string[]) {
  return command(
    session,
    'docker',
    [
      'run',
      '--rm',
      '--user',
      `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
      '--mount',
      `type=bind,source=${session.directory},target=/backup`,
      '-e',
      'AWS_ACCESS_KEY_ID',
      '-e',
      'AWS_SECRET_ACCESS_KEY',
      '-e',
      'AWS_DEFAULT_REGION',
      '-e',
      'AWS_EC2_METADATA_DISABLED',
      '-e',
      'AWS_PAGER',
      awsImage,
      '--endpoint-url',
      store.endpoint,
      's3api',
      ...args,
    ],
    { env: store.env },
  );
}

function availableBackups(
  session: Session,
  store: BackupStore,
  category: Category | undefined,
  prefix: string,
) {
  const response: unknown = JSON.parse(
    b2Command(session, store, [
      'list-objects-v2',
      '--bucket',
      store.bucket,
      '--prefix',
      category ? `${prefix}/${category}/` : `${prefix}/`,
      '--query',
      'Contents[].Key',
      '--output',
      'json',
    ]).toString(),
  );
  return listBackups(response ?? [], category, prefix);
}

async function download(session: Session, key: string, store: BackupStore) {
  const name = basename(key);
  for (const suffix of ['', '.sha256']) {
    b2Command(session, store, [
      'get-object',
      '--bucket',
      store.bucket,
      '--key',
      `${key}${suffix}`,
      `/backup/${name}${suffix}`,
    ]);
    chmodSync(join(session.directory, `${name}${suffix}`), 0o600);
  }
  session.checksum = verifyChecksumValue(
    await fileChecksum(join(session.directory, name)),
    readFileSync(join(session.directory, `${name}.sha256`), 'utf8'),
    name,
  );
  const entries = command(session, 'tar', [
    '-tzf',
    join(session.directory, name),
  ])
    .toString()
    .trim()
    .split('\n')
    .sort();
  if (entries.join('\n') !== 'data.sql\nroles.sql\nschema.sql')
    throw new Error('Contenu d’archive inattendu.');
  const details = command(session, 'tar', [
    '-tvzf',
    join(session.directory, name),
  ])
    .toString()
    .trim()
    .split('\n');
  if (details.length !== 3 || details.some((line) => !line.startsWith('-'))) {
    throw new Error(
      'Seuls trois fichiers SQL ordinaires sont acceptés ; liens et dossiers refusés.',
    );
  }
  saveSession(session);
}

const countsSql = `SELECT format('SELECT %L || %L || count(*)::text FROM %I.%I;', c.relname, ':', n.nspname, c.relname)
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' AND NOT EXISTS (
 SELECT FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e'
) ORDER BY c.relname;`;

const applicationAclObjects = `SELECT format('%s public.%I', CASE c.relkind WHEN 'S' THEN 'SEQUENCE' ELSE 'TABLE' END, c.relname) AS object,
c.relowner AS owner, coalesce(c.relacl, acldefault(CASE c.relkind WHEN 'S' THEN 's'::"char" ELSE 'r'::"char" END, c.relowner)) AS acl
FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.relkind IN ('r','S')
AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e')
UNION ALL
SELECT format('TYPE public.%I', t.typname), t.typowner, coalesce(t.typacl, acldefault('T', t.typowner))
FROM pg_type t WHERE t.typnamespace='public'::regnamespace AND t.typtype='e'
AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid='pg_type'::regclass AND d.objid=t.oid AND d.deptype='e')`;

const resetApplicationPrivileges = `DO $privileges$ DECLARE privilege record; BEGIN
FOR privilege IN SELECT DISTINCT o.object, a.grantee FROM (${applicationAclObjects}) o,
LATERAL aclexplode(o.acl) a WHERE a.grantee <> o.owner
LOOP
EXECUTE format('REVOKE ALL PRIVILEGES ON %s FROM %s', privilege.object,
CASE WHEN privilege.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(privilege.grantee)) END);
END LOOP; END $privileges$;`;

function applicationPrivileges(session: Session): string {
  const columnPrivileges = localSql(
    session,
    `SELECT count(*) FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
WHERE c.relnamespace='public'::regnamespace AND a.attacl IS NOT NULL
AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e');`,
  );
  if (columnPrivileges !== '0')
    throw new Error(
      'Droits spécifiques par colonne non pris en charge : revue manuelle requise.',
    );
  const grants = localSql(
    session,
    `SELECT format('GRANT %s ON %s TO %s%s;', a.privilege_type, o.object,
CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(a.grantee)) END,
CASE WHEN a.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END)
FROM (${applicationAclObjects}) o, LATERAL aclexplode(o.acl) a WHERE a.grantee <> o.owner
ORDER BY o.object, a.grantee, a.privilege_type;`,
  );
  return `${resetApplicationPrivileges}\n${grants}`;
}

async function validateLocally(session: Session) {
  say(
    'Création d’un PostgreSQL isolé, sans accès aux bases Cityborn existantes…',
  );
  command(session, 'docker', [
    'run',
    '-d',
    '--name',
    session.container,
    '--label',
    `${ownershipLabel}=${session.id}`,
    '--network',
    'none',
    '-e',
    'POSTGRES_HOST_AUTH_METHOD=trust',
    localImage,
  ]);
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const result = spawnSync(
      'docker',
      [
        'exec',
        session.container,
        'pg_isready',
        '-h',
        '127.0.0.1',
        '-U',
        'postgres',
      ],
      { stdio: 'ignore' },
    );
    if (result.status === 0) {
      ready = true;
      break;
    }
    await setTimeout(1000);
  }
  if (!ready)
    throw new Error('PostgreSQL local n’est pas prêt après 60 secondes.');
  command(
    session,
    'bash',
    [
      join(scriptDirectory, 'restore-local.sh'),
      join(session.directory, basename(session.sourceKey)),
      session.database,
    ],
    {
      env: {
        ...process.env,
        CITYBORN_RESTORE_CONTAINER: session.container,
        CITYBORN_RESTORE_SESSION: session.id,
      },
    },
  );
  const outsidePublic = localSql(
    session,
    `SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname NOT IN ('public', 'pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%'
AND c.relkind IN ('r','p','v','m','f')
AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e');`,
  );
  if (outsidePublic !== '0')
    throw new Error(
      'Le backup contient des relations non gérées hors de public : restauration distante non prise en charge.',
    );
  localSql(
    session,
    readFileSync(join(scriptDirectory, 'verify-restored-database.sql'), 'utf8'),
  );
  const counts = localSql(session, localSql(session, countsSql));
  privateFile(join(session.directory, 'counts.txt'), counts);
  say(`Restauration locale vérifiée :\n${counts}`);
  session.status = 'local-verified';
  saveSession(session);
}

export function buildApplicationSql(session: Session): string {
  const privileges = applicationPrivileges(session);
  localCommand(
    session,
    'pg_dump',
    [
      '-U',
      'postgres',
      '-d',
      session.database,
      '-Fc',
      '--schema=public',
      '--no-owner',
      '--no-acl',
      '--exclude-table=public.spatial_ref_sys',
    ],
    { output: join(session.directory, 'application.dump') },
  );
  command(session, 'docker', [
    'cp',
    join(session.directory, 'application.dump'),
    `${session.container}:/tmp/application.dump`,
  ]);
  const toc = applicationToc(
    localCommand(session, 'pg_restore', [
      '--list',
      '/tmp/application.dump',
    ]).toString(),
  );
  privateFile(join(session.directory, 'application.list'), toc);
  command(session, 'docker', [
    'cp',
    join(session.directory, 'application.list'),
    `${session.container}:/tmp/application.list`,
  ]);
  const sqlPath = join(session.directory, 'application.sql');
  localCommand(
    session,
    'pg_restore',
    [
      '--no-owner',
      '--no-acl',
      '--use-list=/tmp/application.list',
      '--file=-',
      '/tmp/application.dump',
    ],
    { output: sqlPath },
  );
  appendFileSync(sqlPath, `\n${privileges}\n`);
  return sqlPath;
}

function countAssertions(session: Session): string {
  const expected = readFileSync(
    join(session.directory, 'counts.txt'),
    'utf8',
  ).split('\n');
  return expected
    .map((line) => {
      const separator = line.lastIndexOf(':');
      const table = line.slice(0, separator);
      const count = line.slice(separator + 1);
      if (!/^\d+$/.test(count) || !table)
        throw new Error('Comptage local invalide.');
      return `DO $count$ BEGIN IF (SELECT count(*) FROM public."${table.replaceAll('"', '""')}") <> ${count} THEN RAISE EXCEPTION 'Nombre de lignes différent du backup'; END IF; END $count$;`;
    })
    .join('\n');
}

async function withRemoteConnection(
  session: Session,
  action: (connection: Connection) => Promise<void> | void,
) {
  if (session.target === 'local')
    throw new Error('Choisir explicitement une cible staging ou production.');
  const prefix = `RESTORE_${session.target.toUpperCase()}`;
  const connection = parseConnection(
    await configuration(`${prefix}_DB_URL`, true),
    await configuration(`${prefix}_PROJECT_REF`),
  );
  const certificatePath = resolve(
    await configuration(`${prefix}_SSL_ROOT_CERT`),
  );
  if (!lstatSync(certificatePath).isFile())
    throw new Error('Le certificat doit être un fichier ordinaire.');
  privateFile(
    join(session.directory, 'root.crt'),
    validateRootCertificate(readFileSync(certificatePath, 'utf8')),
  );
  const passLine = [
    connection.host,
    connection.port,
    connection.database,
    connection.user,
    connection.password,
  ]
    .map((value) => value.replaceAll('\\', '\\\\').replaceAll(':', '\\:'))
    .join(':');
  const passPath = join(session.directory, 'pgpass');
  privateFile(passPath, `${passLine}\n`);
  try {
    const identity = remoteSql(
      session,
      connection,
      `SELECT current_database(), current_user, current_setting('server_version_num');`,
    );
    const [database, user, version] = identity.split('|');
    if (
      database !== 'postgres' ||
      user !== 'postgres' ||
      Number(version) < 160000 ||
      Number(version) >= 180000
    ) {
      throw new Error(
        'Cible non prise en charge : postgres, rôle postgres et PostgreSQL 16/17 requis.',
      );
    }
    say(
      `Cible vérifiée : ${session.target} / projet ${connection.project} / ${connection.host} / ${database}`,
    );
    await action(connection);
  } finally {
    rmSync(passPath, { force: true });
  }
}

async function diagnoseRemote(session: Session) {
  await withRemoteConnection(session, (connection) => {
    const report = remoteSql(
      session,
      connection,
      readFileSync(join(scriptDirectory, 'diagnose-restoration.sql'), 'utf8'),
    );
    const reportPath = join(session.directory, 'diagnostic.json');
    privateFile(reportPath, report);
    say(
      `Diagnostic en lecture seule (métadonnées uniquement) :\n${report}\nRapport conservé : ${reportPath}`,
    );
    session.status = 'remote-diagnosed';
    saveSession(session);
  });
}

async function restoreRemote(session: Session, options: Options) {
  buildApplicationSql(session);
  await withRemoteConnection(session, async (connection) => {
    say(`Backup : ${session.sourceKey}\nSHA-256 : ${session.checksum}`);
    const replacementGuard = readFileSync(
      join(scriptDirectory, 'restore-public.sql'),
      'utf8',
    );
    try {
      remoteSql(
        session,
        connection,
        `BEGIN READ ONLY; SET LOCAL cityborn.restore_check_only='on';\n${replacementGuard}\nROLLBACK;`,
      );
    } catch (error) {
      say(
        `Précontrôle refusé. Diagnostic sans téléchargement ni restauration : pnpm db:restore:diagnose --target ${session.target}`,
      );
      throw error;
    }
    if (options.checkOnly) {
      session.status = 'remote-preflight-verified';
      saveSession(session);
      say(
        'Contrôle uniquement : connexion et objets pris en charge vérifiés, aucune écriture distante. Les dépendances externes seront protégées par DROP RESTRICT lors du remplacement.',
      );
      return;
    }
    say(
      'ARRÊTER les écritures, workers et migrations. La restauration remplace les tables, enums et séquences applicatifs de public. Les données postérieures au backup ne seront pas conservées.',
    );
    await confirm(`MAINTENANCE ${options.target} ${connection.project}`);
    mkdirSync(safetyRoot, { recursive: true, mode: 0o700 });
    if (lstatSync(safetyRoot).isSymbolicLink())
      throw new Error('Dossier de secours symbolique refusé.');
    chmodSync(safetyRoot, 0o700);
    const safetyDirectory = join(safetyRoot, session.id);
    mkdirSync(safetyDirectory, { mode: 0o700 });
    const safetyPath = join(safetyDirectory, 'before.dump');
    say('Sauvegarde de sécurité de public avant toute suppression…');
    remoteCommand(
      session,
      connection,
      'pg_dump',
      ['-Fc', '--schema=public', '--no-owner'],
      { output: safetyPath },
    );
    if (!lstatSync(safetyPath).size)
      throw new Error('Sauvegarde de sécurité vide : remplacement interdit.');
    command(
      session,
      'docker',
      [
        'run',
        '--rm',
        '-i',
        '--network',
        'none',
        '--entrypoint',
        'pg_restore',
        clientImage,
        '--file=-',
      ],
      {
        inputFile: safetyPath,
        output: join(safetyDirectory, 'before.sql'),
      },
    );
    const safetyChecksum = await fileChecksum(safetyPath);
    privateFile(`${safetyPath}.sha256`, `${safetyChecksum}  before.dump\n`);
    privateFile(
      join(safetyDirectory, 'identity.json'),
      JSON.stringify(
        {
          target: options.target,
          project: connection.project,
          host: connection.host,
          createdAt: new Date().toISOString(),
          sourceKey: session.sourceKey,
        },
        null,
        2,
      ),
    );
    session.safetyBackup = safetyPath;
    saveSession(session);
    say(
      `Sauvegarde conservée : ${safetyPath}\nElle ne sera pas effacée par db:restore:cleanup.`,
    );
    await confirm(
      `RESTORE ${options.target} ${connection.project} ${basename(session.sourceKey)}`,
    );
    privateFile(join(session.directory, 'replace.sql'), replacementGuard);
    privateFile(
      join(session.directory, 'verify.sql'),
      [
        readFileSync(
          join(scriptDirectory, 'verify-restored-database.sql'),
          'utf8',
        ),
        countAssertions(session),
      ].join('\n'),
    );
    session.status = 'remote-started';
    saveSession(session);
    remoteCommand(session, connection, 'psql', [
      '-X',
      '-1',
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      '/restore/replace.sql',
      '-f',
      '/restore/application.sql',
      '-f',
      '/restore/verify.sql',
    ]);
    session.status = 'remote-verified';
    saveSession(session);
    say(
      'Restauration distante validée techniquement. Effectuer les tests fonctionnels avant de reprendre les écritures. Ne pas relancer les migrations de la version défectueuse.',
    );
  });
}

async function cleanup(id: string) {
  if (!sessionPattern.test(id))
    throw new Error('Identifiant de session invalide.');
  const directory = join(sessionsRoot, id);
  if (
    !existsSync(directory) ||
    realpathSync(directory) !== directory ||
    lstatSync(directory).isSymbolicLink()
  ) {
    throw new Error('Dossier de session absent ou non sûr.');
  }
  const container = `cityborn-${id}`;
  const manifest: unknown = JSON.parse(
    readFileSync(join(directory, 'session.json'), 'utf8'),
  );
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    !('id' in manifest) ||
    manifest.id !== id ||
    !('container' in manifest) ||
    manifest.container !== container
  ) {
    throw new Error(
      'Manifest de session non reconnu : aucun nettoyage automatique.',
    );
  }
  const inventory = spawnSync(
    'docker',
    ['container', 'ls', '-a', '--format', '{{.Names}}'],
    { encoding: 'utf8' },
  );
  if (inventory.status !== 0)
    throw new Error('Docker indisponible : nettoyage interrompu.');
  const containerExists = inventory.stdout
    .trim()
    .split('\n')
    .includes(container);
  if (containerExists) {
    const label = spawnSync(
      'docker',
      [
        'inspect',
        '--format',
        `{{ index .Config.Labels "${ownershipLabel}" }}`,
        container,
      ],
      { encoding: 'utf8' },
    );
    if (label.status !== 0 || label.stdout.trim() !== id) {
      throw new Error('Conteneur non reconnu : aucun nettoyage automatique.');
    }
  }
  say(
    `Suppression de ${container} et ${directory}. Les sauvegardes de sécurité sont conservées.`,
  );
  await confirm(`DELETE ${id}`);
  if (containerExists) {
    const removed = spawnSync('docker', ['rm', '-f', '-v', container], {
      stdio: 'ignore',
    });
    if (removed.status !== 0)
      throw new Error(
        'Suppression du conteneur impossible ; fichiers conservés.',
      );
  }
  rmSync(directory, { recursive: true });
  say('Base de test, volume Docker et fichiers de cette session supprimés.');
}

export async function main(args: string[]) {
  process.umask(0o077);
  if (args.includes('--help')) {
    say(
      'pnpm db:restore [nom.tar.gz|clé-B2|latest] [--kind daily|weekly|pre-migration] [--target local|staging|production] [--check-only]\nSans nom de backup : choix interactif parmi tous les backups B2 (filtrés si --kind est fourni).\nlatest et les noms seuls utilisent daily par défaut.\npnpm db:restore:list [--kind daily|weekly|pre-migration]\npnpm db:restore:diagnose --target staging|production\npnpm db:restore:cleanup <restore-XXXXXX>\nConfiguration : apps/backend/.env.restore (facultatif, ignoré par Git). Aucune URL de production implicite.',
    );
    return;
  }
  if (args[0] === 'cleanup') {
    if (args.length !== 2)
      throw new Error('Usage : pnpm db:restore:cleanup <restore-XXXXXX>');
    await cleanup(args[1]);
    return;
  }
  const config = join(repositoryRoot, 'apps/backend/.env.restore');
  if (existsSync(config)) {
    if (
      !lstatSync(config).isFile() ||
      lstatSync(config).isSymbolicLink() ||
      (lstatSync(config).mode & 0o077) !== 0
    ) {
      throw new Error(
        'Le fichier .env.restore doit être un fichier ordinaire accessible uniquement à son propriétaire (chmod 600).',
      );
    }
    process.loadEnvFile(config);
  }
  const listing = args[0] === 'list';
  const diagnosis = args[0] === 'diagnose';
  const options = parseOptions(args);
  if (
    diagnosis &&
    (options.target === 'local' || options.category || options.checkOnly)
  )
    throw new Error(
      'Usage : pnpm db:restore:diagnose --target staging|production',
    );
  if (listing && (options.target !== 'local' || options.checkOnly))
    throw new Error(
      'Usage : pnpm db:restore:list [--kind daily|weekly|pre-migration]',
    );
  const prefix = process.env.RESTORE_B2_PREFIX || 'cityborn';
  if (!diagnosis && !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(prefix))
    throw new Error('Préfixe Backblaze invalide.');
  const key =
    !options.backup || listing || diagnosis || options.backup === 'latest'
      ? ''
      : backupKey(options.backup, options.category ?? 'daily', prefix);
  const session = createSession(options.target, key);
  say(`Session : ${session.id}`);
  try {
    if (diagnosis) {
      await diagnoseRemote(session);
      say(`Nettoyage : pnpm db:restore:cleanup ${session.id}`);
      return;
    }
    const store = await backupStore();
    if (!options.backup || listing || options.backup === 'latest') {
      const category =
        options.backup === 'latest'
          ? (options.category ?? 'daily')
          : options.category;
      say(
        `Lecture des backups ${category ?? 'de toutes les catégories'} dans B2…`,
      );
      const backups = availableBackups(session, store, category, prefix);
      if (listing) {
        say(
          backups.length
            ? backups
                .map(
                  (backup) =>
                    `${backup.key}${backup.complete ? '' : ' [SHA-256 absent]'}`,
                )
                .join('\n')
            : 'Aucun backup disponible.',
        );
        rmSync(session.directory, { recursive: true });
        return;
      }
      session.sourceKey =
        options.backup === 'latest'
          ? latestBackup(backups)
          : await selectBackup(backups);
      saveSession(session);
    }
    say(`Backup sélectionné : ${session.sourceKey}`);
    say('Téléchargement et contrôle de l’archive B2…');
    await download(session, session.sourceKey, store);
    await validateLocally(session);
    if (options.target !== 'local') await restoreRemote(session, options);
    say(
      `Session conservée pour validation : ${session.directory}\nNettoyage après validation : pnpm db:restore:cleanup ${session.id}`,
    );
  } catch (error) {
    const uncertain = session.status === 'remote-started';
    session.status = uncertain ? 'remote-outcome-to-check' : 'failed';
    saveSession(session);
    if (uncertain)
      say(
        'En cas de coupure réseau, vérifier l’état distant avant de relancer. Une erreur SQL annule la transaction ; une confirmation de COMMIT perdue peut rendre le résultat incertain.',
      );
    say(
      `Session conservée : ${session.directory}\nNettoyage : pnpm db:restore:cleanup ${session.id}`,
    );
    throw error;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Échec de la restauration.'}\n`,
    );
    process.exitCode = 1;
  });
}
