UPDATE "User"
SET "authVersion" = GREATEST("authVersion", "sessionVersion");

ALTER TABLE "User" DROP COLUMN "sessionVersion";
