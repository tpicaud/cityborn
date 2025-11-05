ALTER TABLE "public"."EmailVerificationToken" ADD COLUMN "userId_temp" UUID;

UPDATE "public"."EmailVerificationToken"
SET "userId_temp" = "userId"::uuid;

ALTER TABLE "public"."EmailVerificationToken" DROP COLUMN "userId";
ALTER TABLE "public"."EmailVerificationToken" RENAME COLUMN "userId_temp" TO "userId";

CREATE UNIQUE INDEX IF NOT EXISTS "User_uuid_key" ON "public"."User"("uuid");

ALTER TABLE "public"."EmailVerificationToken" 
ADD CONSTRAINT "EmailVerificationToken_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "public"."User"("uuid") 
ON DELETE RESTRICT 
ON UPDATE CASCADE;
