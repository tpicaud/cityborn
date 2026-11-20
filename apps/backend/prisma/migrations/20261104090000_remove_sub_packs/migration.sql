-- DropForeignKey
ALTER TABLE "Pack" DROP CONSTRAINT "Pack_parentId_fkey";

-- DropIndex
DROP INDEX "Pack_parentId_idx";

-- AlterTable
ALTER TABLE "Pack" DROP COLUMN "parentId";
