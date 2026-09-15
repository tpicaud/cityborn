DO $verify$
DECLARE
  foreign_key record;
  join_condition text;
  null_condition text;
  all_null_condition text;
  orphan_found boolean;
BEGIN
  IF to_regclass('public."User"') IS NULL
    OR to_regclass('public."_prisma_migrations"') IS NULL THEN
    RAISE EXCEPTION 'Tables Cityborn absentes du backup restauré';
  END IF;

  IF EXISTS (
    SELECT FROM public."_prisma_migrations"
    WHERE finished_at IS NULL AND rolled_back_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Migration Prisma inachevée et non annulée';
  END IF;

  IF NOT EXISTS (
    SELECT FROM public."_prisma_migrations"
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Aucune migration Prisma appliquée';
  END IF;

  FOR foreign_key IN
    SELECT c.oid, c.conname, c.conrelid, c.confrelid, c.confmatchtype, c.conkey, c.confkey
    FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND c.contype = 'f'
  LOOP
    SELECT
      string_agg(format('child.%I = parent.%I', a.attname, b.attname), ' AND ' ORDER BY k.ordinality),
      string_agg(format('child.%I IS NOT NULL', a.attname), ' AND ' ORDER BY k.ordinality),
      string_agg(format('child.%I IS NULL', a.attname), ' AND ' ORDER BY k.ordinality)
    INTO join_condition, null_condition, all_null_condition
    FROM unnest(foreign_key.conkey, foreign_key.confkey) WITH ORDINALITY k(child_key, parent_key, ordinality)
    JOIN pg_attribute a ON a.attrelid = foreign_key.conrelid AND a.attnum = k.child_key
    JOIN pg_attribute b ON b.attrelid = foreign_key.confrelid AND b.attnum = k.parent_key;

    IF foreign_key.confmatchtype = 'f' THEN
      null_condition := 'NOT (' || all_null_condition || ')';
    END IF;

    EXECUTE format(
      'SELECT EXISTS (SELECT FROM %s child WHERE (%s) AND NOT EXISTS (SELECT FROM %s parent WHERE %s))',
      foreign_key.conrelid::regclass, null_condition, foreign_key.confrelid::regclass, join_condition
    ) INTO orphan_found;
    IF orphan_found THEN
      RAISE EXCEPTION 'Références orphelines : %', foreign_key.conname;
    END IF;
  END LOOP;
END
$verify$;
