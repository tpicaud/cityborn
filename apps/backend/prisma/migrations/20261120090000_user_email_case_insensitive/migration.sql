DO $$
DECLARE
  shared_email_count integer;
BEGIN
  SELECT count(*) INTO shared_email_count
  FROM (
    SELECT lower("email") FROM "User" GROUP BY lower("email") HAVING count(*) > 1
  ) AS shared_emails;
  IF shared_email_count > 0 THEN
    RAISE EXCEPTION '% email address(es) are shared by several accounts ignoring case: resolve each duplicate manually before applying this migration', shared_email_count;
  END IF;
END $$;

DROP INDEX "User_email_key";
CREATE UNIQUE INDEX "User_email_case_insensitive_key" ON "User" (lower("email"));
