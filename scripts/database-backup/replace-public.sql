SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '15min';

DO $replace$
DECLARE
  application_object_names text;
BEGIN
  IF NOT pg_try_advisory_xact_lock(561409, 1) THEN
    RAISE EXCEPTION 'Une restauration Cityborn est déjà en cours';
  END IF;
  IF current_user <> 'postgres' OR to_regclass('public."_prisma_migrations"') IS NULL THEN
    RAISE EXCEPTION 'La cible doit être une base Cityborn accessible avec le rôle postgres';
  END IF;

  IF EXISTS (
    SELECT FROM pg_publication_rel p JOIN pg_class c ON c.oid = p.prrelid
    WHERE c.relnamespace = 'public'::regnamespace
  ) OR EXISTS (SELECT FROM pg_publication WHERE puballtables)
    OR EXISTS (SELECT FROM pg_publication_namespace WHERE pnnspid = 'public'::regnamespace) THEN
    RAISE EXCEPTION 'Tables public publiées : adaptation manuelle nécessaire';
  END IF;

  SELECT string_agg(format('public.%I', c.relname), ', ') INTO application_object_names
  FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'
    AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid = 'pg_class'::regclass
      AND d.objid = c.oid AND d.deptype = 'e');
  IF application_object_names IS NULL THEN
    RAISE EXCEPTION 'Aucune table applicative dans la cible';
  END IF;
  EXECUTE 'DROP TABLE ' || application_object_names || ' RESTRICT';

  SELECT string_agg(format('public.%I', c.relname), ', ') INTO application_object_names
  FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'S'
    AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid = 'pg_class'::regclass
      AND d.objid = c.oid AND d.deptype = 'e');
  IF application_object_names IS NOT NULL THEN
    EXECUTE 'DROP SEQUENCE ' || application_object_names || ' RESTRICT';
  END IF;

  SELECT string_agg(format('public.%I', t.typname), ', ') INTO application_object_names
  FROM pg_type t
  WHERE t.typnamespace = 'public'::regnamespace AND t.typtype = 'e'
    AND NOT EXISTS (SELECT FROM pg_depend d WHERE d.classid = 'pg_type'::regclass
      AND d.objid = t.oid AND d.deptype = 'e');
  IF application_object_names IS NOT NULL THEN
    EXECUTE 'DROP TYPE ' || application_object_names || ' RESTRICT';
  END IF;
END
$replace$;
