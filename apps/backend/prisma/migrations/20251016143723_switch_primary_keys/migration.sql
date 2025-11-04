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

-- DropForeignKey
ALTER TABLE "public"."_GameRecordUsers" DROP CONSTRAINT "_GameRecordUsers_B_fkey";

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

-- AlterTable
ALTER TABLE "public"."_GameRecordUsers" DROP CONSTRAINT "_GameRecordUsers_AB_pkey",
DROP COLUMN "A",
ADD COLUMN     "A" UUID NOT NULL,
DROP COLUMN "B",
ADD COLUMN     "B" UUID NOT NULL,
ADD CONSTRAINT "_GameRecordUsers_AB_pkey" PRIMARY KEY ("A", "B");

-- CreateIndex
CREATE INDEX "_GameRecordUsers_B_index" ON "public"."_GameRecordUsers"("B");

-- AddForeignKey
ALTER TABLE "public"."_GameRecordUsers" ADD CONSTRAINT "_GameRecordUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."GameRecord"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GameRecordUsers" ADD CONSTRAINT "_GameRecordUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
