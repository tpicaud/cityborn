ALTER TABLE "EmailVerificationToken" ADD COLUMN "email" TEXT;

UPDATE "EmailVerificationToken"
SET "email" = "User"."email"
FROM "User"
WHERE "EmailVerificationToken"."userId" = "User"."id";

ALTER TABLE "EmailVerificationToken" ALTER COLUMN "email" SET NOT NULL;
