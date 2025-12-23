/*
  Warnings:

  - You are about to drop the column `id` on the `EmailVerificationToken` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `GameRecord` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."EmailVerificationToken" DROP COLUMN "id";

-- AlterTable
ALTER TABLE "public"."Event" DROP COLUMN "id";

-- AlterTable
ALTER TABLE "public"."GameRecord" DROP COLUMN "id";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "id";
