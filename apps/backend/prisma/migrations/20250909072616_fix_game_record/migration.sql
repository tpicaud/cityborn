/*
  Warnings:

  - You are about to drop the `_Players` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `players` to the `GameRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."_Players" DROP CONSTRAINT "_Players_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_Players" DROP CONSTRAINT "_Players_B_fkey";

-- AlterTable
ALTER TABLE "public"."GameRecord" ADD COLUMN     "players" JSONB NOT NULL,
ADD COLUMN     "userId" INTEGER;

-- DropTable
DROP TABLE "public"."_Players";

-- AddForeignKey
ALTER TABLE "public"."GameRecord" ADD CONSTRAINT "GameRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
