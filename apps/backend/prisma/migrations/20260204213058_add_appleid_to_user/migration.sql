/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `GuessObject` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GuessObject_name_key" ON "GuessObject"("name");
