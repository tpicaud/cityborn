SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '15min';

DO $guard$
DECLARE
  object_names text;
BEGIN
  IF NOT pg_try_advisory_xact_lock(561409, 1) THEN
    RAISE EXCEPTION 'Une autre restauration Cityborn est en cours';
  END IF;

  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'La restauration exige le rôle postgres';
  END IF;

  IF to_regclass('public."_prisma_migrations"') IS NULL THEN
    RAISE EXCEPTION 'La cible ne ressemble pas à une base Cityborn existante';
  END IF;

  IF EXISTS (
    SELECT FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind IN ('v', 'm', 'f', 'p')
      AND NOT EXISTS (
        SELECT FROM pg_depend d
        WHERE d.deptype = 'e' AND (
          (d.classid = 'pg_class'::regclass AND d.objid = c.oid)
          OR (d.classid = 'pg_type'::regclass AND d.objid = c.reltype)
        )
      )
  ) OR EXISTS (
    SELECT FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND NOT EXISTS (
        SELECT FROM pg_depend d
        WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
      )
  ) OR EXISTS (
    SELECT FROM pg_type t
    WHERE t.typnamespace = 'public'::regnamespace
      AND t.typtype IN ('d', 'r', 'm')
      AND NOT EXISTS (
        SELECT FROM pg_depend d
        WHERE d.classid = 'pg_type'::regclass AND d.objid = t.oid AND d.deptype = 'e'
      )
  ) OR EXISTS (
    SELECT FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'c'
      AND NOT EXISTS (
        SELECT FROM pg_depend d
        WHERE d.deptype = 'e' AND (
          (d.classid = 'pg_class'::regclass AND d.objid = c.oid)
          OR (d.classid = 'pg_type'::regclass AND d.objid = c.reltype)
        )
      )
  ) THEN
    RAISE EXCEPTION 'Objets public non pris en charge : vues, fonctions, domaines, types composites ou partitions. Revue manuelle requise';
  END IF;

  IF EXISTS (
    SELECT FROM pg_publication_rel pr JOIN pg_class c ON c.oid = pr.prrelid
    WHERE c.relnamespace = 'public'::regnamespace
  ) OR EXISTS (SELECT FROM pg_publication WHERE puballtables)
    OR EXISTS (SELECT FROM pg_publication_namespace WHERE pnnspid = 'public'::regnamespace)
    OR EXISTS (
      SELECT FROM pg_event_trigger e
      JOIN pg_proc p ON p.oid = e.evtfoid
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_roles r ON r.oid = p.proowner
      WHERE e.evtenabled <> 'D' AND NOT coalesce((
        n.nspname = 'extensions' AND r.rolsuper AND (
          (e.evtname = 'pgrst_ddl_watch' AND p.proname = 'pgrst_ddl_watch')
          OR (e.evtname = 'pgrst_drop_watch' AND p.proname = 'pgrst_drop_watch')
          OR (e.evtname = 'issue_pg_graphql_access' AND p.proname = 'grant_pg_graphql_access'
            AND e.evtevent = 'ddl_command_end' AND e.evttags = ARRAY['CREATE FUNCTION']::text[])
          OR (e.evttags <@ ARRAY['CREATE EXTENSION', 'DROP EXTENSION']::text[]
            AND e.evtname IN ('issue_pg_cron_access', 'issue_pg_graphql_access', 'issue_pg_net_access', 'issue_graphql_placeholder'))
        )
      ), false)
    ) THEN
    RAISE EXCEPTION 'Publication ou event trigger actif : revue manuelle requise avant remplacement';
  END IF;

  IF current_setting('cityborn.restore_check_only', true) = 'on' THEN
    RETURN;
  END IF;

  SELECT string_agg(format('%I.%I', n.nspname, c.relname), ', ' ORDER BY c.relname)
  INTO object_names
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND NOT EXISTS (
      SELECT FROM pg_depend d
      WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e'
    );

  IF object_names IS NULL THEN
    RAISE EXCEPTION 'Aucune table applicative à remplacer';
  END IF;

  EXECUTE 'LOCK TABLE ' || object_names || ' IN ACCESS EXCLUSIVE MODE';
  EXECUTE 'DROP TABLE ' || object_names || ' RESTRICT';

  SELECT string_agg(format('%I.%I', n.nspname, c.relname), ', ' ORDER BY c.relname)
  INTO object_names
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'S'
    AND NOT EXISTS (
      SELECT FROM pg_depend d
      WHERE d.classid = 'pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e'
    );
  IF object_names IS NOT NULL THEN
    EXECUTE 'DROP SEQUENCE ' || object_names || ' RESTRICT';
  END IF;

  SELECT string_agg(format('%I.%I', n.nspname, t.typname), ', ' ORDER BY t.typname)
  INTO object_names
  FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typtype = 'e'
    AND NOT EXISTS (
      SELECT FROM pg_depend d
      WHERE d.classid = 'pg_type'::regclass AND d.objid = t.oid AND d.deptype = 'e'
    );
  IF object_names IS NOT NULL THEN
    EXECUTE 'DROP TYPE ' || object_names || ' RESTRICT';
  END IF;
END
$guard$;
