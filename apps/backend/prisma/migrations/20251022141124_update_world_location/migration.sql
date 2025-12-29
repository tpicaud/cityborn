/*
  Warnings:

  - You are about to drop the column `parentId` on the `WorldLocation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."WorldLocation" DROP CONSTRAINT "WorldLocation_parentId_fkey";

-- AlterTable
ALTER TABLE "WorldLocation" DROP COLUMN "parentId",
ADD COLUMN     "addresstype" TEXT;
