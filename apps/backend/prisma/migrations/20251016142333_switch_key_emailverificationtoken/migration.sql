-- 1. Drop ancienne contrainte
ALTER TABLE "public"."EmailVerificationToken"
    DROP CONSTRAINT IF EXISTS "EmailVerificationToken_userId_fkey";

-- 2. Ajouter la nouvelle colonne en nullable
ALTER TABLE "public"."EmailVerificationToken"
    ADD COLUMN "userId_new" UUID;

-- 3. Backfill depuis l’ancienne colonne vers User.uuid
UPDATE "public"."EmailVerificationToken" t
SET "userId_new" = u."uuid"
FROM "public"."User" u
WHERE t."userId" = u."id";

-- 4. Supprimer les tokens orphelins (si certains userId ne correspondaient plus)
DELETE FROM "public"."EmailVerificationToken"
WHERE "userId_new" IS NULL;

-- 5. Rendre la nouvelle colonne NOT NULL
ALTER TABLE "public"."EmailVerificationToken"
    ALTER COLUMN "userId_new" SET NOT NULL;

-- 6. Supprimer l’ancienne colonne
ALTER TABLE "public"."EmailVerificationToken"
    DROP COLUMN "userId";

-- 7. Renommer la nouvelle colonne
ALTER TABLE "public"."EmailVerificationToken"
    RENAME COLUMN "userId_new" TO "userId";

-- 8. Créer l’index unique sur User.uuid si nécessaire
CREATE UNIQUE INDEX IF NOT EXISTS "User_uuid_key" ON "public"."User"("uuid");

-- 9. Recréer la contrainte de clé étrangère
ALTER TABLE "public"."EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."User"("uuid")
    ON DELETE RESTRICT ON UPDATE CASCADE;
