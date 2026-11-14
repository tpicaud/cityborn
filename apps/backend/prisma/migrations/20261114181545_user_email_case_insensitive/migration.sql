BEGIN;

LOCK TABLE "User" IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
  collisions jsonb;
BEGIN
  SELECT jsonb_agg(collision ORDER BY collision.email)
  INTO collisions
  FROM (
    SELECT lower("email") AS email, array_agg("id" ORDER BY "id") AS "userIds"
    FROM "User"
    GROUP BY lower("email")
    HAVING count(*) > 1
  ) AS collision;
  IF collisions IS NOT NULL THEN
    RAISE EXCEPTION 'Case-insensitive email collisions prevent migration'
      USING DETAIL = collisions::text,
            HINT = 'Resolve each account collision explicitly, without automatic merging, before retrying the migration.';
  END IF;
END
$$;

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE public.citext;

COMMIT;
