-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" UUID;

-- AlterTable
ALTER TABLE "WorldLocationGeometry" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
