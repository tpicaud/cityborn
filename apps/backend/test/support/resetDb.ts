import type { PrismaClient } from '@prisma/client';

export async function resetDb(prisma: PrismaClient) {
  const [connection] = await prisma.$queryRaw<
    { database: string; user: string }[]
  >`SELECT current_database()::text AS database, current_user::text AS "user"`;

  if (
    connection?.database !== 'cityborn_test' ||
    connection.user !== 'cityborn_test'
  ) {
    throw new Error(
      'resetDb only supports the dedicated cityborn_test database',
    );
  }

  const tables = await prisma.$queryRaw<{ quotedTableName: string }[]>`
    SELECT format('%I.%I', namespace.nspname, relation.relname) AS "quotedTableName"
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relkind = 'r'
      AND relation.relname <> '_prisma_migrations'
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend AS dependency
        WHERE dependency.classid = 'pg_class'::regclass
          AND dependency.objid = relation.oid
          AND dependency.deptype = 'e'
      )
  `;

  if (tables.length === 0) return;

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.map(({ quotedTableName }) => quotedTableName).join(', ')} RESTART IDENTITY CASCADE`,
  );
}
