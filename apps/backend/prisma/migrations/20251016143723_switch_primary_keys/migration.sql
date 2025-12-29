/*
  Warnings:

  - The primary key for the `EmailVerificationToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `GameRecord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_GameRecordUsers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `A` on the `_GameRecordUsers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `B` on the `_GameRecordUsers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."_GameRecordUsers" DROP CONSTRAINT "_GameRecordUsers_A_fkey";
ALTER TABLE "public"."_GameRecordUsers" DROP CONSTRAINT "_GameRecordUsers_B_fkey";
ALTER TABLE "public"."_GameRecordUsers" DROP CONSTRAINT IF EXISTS "_GameRecordUsers_AB_pkey";


-- AlterTable
ALTER TABLE "public"."EmailVerificationToken" DROP CONSTRAINT "EmailVerificationToken_pkey",
ADD CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("uuid");

-- AlterTable
ALTER TABLE "public"."Event" DROP CONSTRAINT "Event_pkey",
ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("uuid");

-- AlterTable
ALTER TABLE "public"."GameRecord" DROP CONSTRAINT "GameRecord_pkey",
ADD CONSTRAINT "GameRecord_pkey" PRIMARY KEY ("uuid");

-- AlterTable
ALTER TABLE "public"."User" DROP CONSTRAINT "User_pkey",
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("uuid");



-- 2. Ajouter des colonnes temporaires en nullable
ALTER TABLE "public"."_GameRecordUsers"
    ADD COLUMN "A_new" UUID,
    ADD COLUMN "B_new" UUID;

-- 3. Backfill depuis les colonnes existantes
UPDATE "_GameRecordUsers" t
SET "A_new" = g."uuid",    -- gameRecordId
    "B_new" = u."uuid"     -- userId
FROM "public"."GameRecord" g,
     "public"."User" u
WHERE t."A" = g."id"      -- ou autre colonne de correspondance dans GameRecord
  AND t."B" = u."id";   -- correspondance User


-- 4. Supprimer les lignes avec NULL dans la nouvelle colonne (facultatif mais conseillé)
DELETE FROM "_GameRecordUsers"
WHERE "A_new" IS NULL OR "B_new" IS NULL;

-- 5. Rendre les nouvelles colonnes NOT NULL
ALTER TABLE "_GameRecordUsers"
    ALTER COLUMN "A_new" SET NOT NULL,
    ALTER COLUMN "B_new" SET NOT NULL;

-- 6. Supprimer les anciennes colonnes
ALTER TABLE "_GameRecordUsers" DROP COLUMN "A";
ALTER TABLE "_GameRecordUsers" DROP COLUMN "B";


-- 7. Renommer les nouvelles colonnes
ALTER TABLE "_GameRecordUsers" RENAME COLUMN "A_new" TO "A";
ALTER TABLE "_GameRecordUsers" RENAME COLUMN "B_new" TO "B";


-- 8. Recréer la clé primaire
ALTER TABLE "_GameRecordUsers"
    ADD CONSTRAINT "_GameRecordUsers_AB_pkey" PRIMARY KEY ("A", "B");

-- 9. Recréer les clés étrangères
ALTER TABLE "_GameRecordUsers"
    ADD CONSTRAINT "_GameRecordUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."GameRecord"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_GameRecordUsers"
    ADD CONSTRAINT "_GameRecordUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Recréer les index si nécessaire
CREATE INDEX "_GameRecordUsers_B_index" ON "public"."_GameRecordUsers"("B");