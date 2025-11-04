/*
  Warnings:

  - The primary key for the `EmailVerificationToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `uuid` on the `EmailVerificationToken` table. All the data in the column will be lost.
  - The primary key for the `Event` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `uuid` on the `Event` table. All the data in the column will be lost.
  - The primary key for the `GameRecord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `uuid` on the `GameRecord` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `uuid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `GameRecordUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."EmailVerificationToken" DROP CONSTRAINT "EmailVerificationToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GameRecordUser" DROP CONSTRAINT "GameRecordUser_gameRecordId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GameRecordUser" DROP CONSTRAINT "GameRecordUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_GameRecordUsers" DROP CONSTRAINT "_GameRecordUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_GameRecordUsers" DROP CONSTRAINT "_GameRecordUsers_B_fkey";

-- DropIndex
DROP INDEX "public"."GameRecord_uuid_key";

-- DropIndex
DROP INDEX "public"."User_uuid_key";

-- AlterTable
ALTER TABLE "public"."EmailVerificationToken" DROP CONSTRAINT "EmailVerificationToken_pkey",
DROP COLUMN "uuid",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Event" DROP CONSTRAINT "Event_pkey",
DROP COLUMN "uuid",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."GameRecord" DROP CONSTRAINT "GameRecord_pkey",
DROP COLUMN "uuid",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "GameRecord_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "uuid",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."GameRecordUser";

-- AddForeignKey
ALTER TABLE "public"."EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GameRecordUsers" ADD CONSTRAINT "_GameRecordUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."GameRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GameRecordUsers" ADD CONSTRAINT "_GameRecordUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
