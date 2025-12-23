/*
  Warnings:

  - The values [good,average,bad] on the enum `ScoreType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScoreType_new" AS ENUM ('GOOD', 'AVERAGE', 'BAD');
ALTER TABLE "EndGameSentence" ALTER COLUMN "score_type" TYPE "ScoreType_new" USING ("score_type"::text::"ScoreType_new");
ALTER TYPE "ScoreType" RENAME TO "ScoreType_old";
ALTER TYPE "ScoreType_new" RENAME TO "ScoreType";
DROP TYPE "public"."ScoreType_old";
COMMIT;
