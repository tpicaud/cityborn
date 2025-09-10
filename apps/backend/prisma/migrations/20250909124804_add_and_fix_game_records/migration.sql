/*
  Warnings:

  - You are about to drop the column `userId` on the `GameRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."GameRecord" DROP CONSTRAINT "GameRecord_userId_fkey";

-- AlterTable
ALTER TABLE "public"."GameRecord" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "public"."_GameRecordUsers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GameRecordUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GameRecordUsers_B_index" ON "public"."_GameRecordUsers"("B");

-- AddForeignKey
ALTER TABLE "public"."_GameRecordUsers" ADD CONSTRAINT "_GameRecordUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."GameRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GameRecordUsers" ADD CONSTRAINT "_GameRecordUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
