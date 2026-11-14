-- AlterTable
ALTER TABLE "Pack" ALTER COLUMN "themeId" SET DEFAULT '244b803a-63aa-460a-a40d-4eea0ec2be50';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_appleId_key" ON "User"("appleId");
