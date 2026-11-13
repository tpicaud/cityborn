/*
  Warnings:

  - A unique constraint covering the columns `[googleSubject]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Pack" ALTER COLUMN "themeId" SET DEFAULT '244b803a-63aa-460a-a40d-4eea0ec2be50';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleSubject" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");
