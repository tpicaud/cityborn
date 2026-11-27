-- AlterTable
ALTER TABLE "CatalogSection" ADD COLUMN     "themeId" UUID;

-- CreateIndex
CREATE INDEX "CatalogSection_themeId_idx" ON "CatalogSection"("themeId");

-- AddForeignKey
ALTER TABLE "CatalogSection" ADD CONSTRAINT "CatalogSection_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "CatalogSection_name_case_insensitive_key";

-- CreateIndex
CREATE UNIQUE INDEX "CatalogSection_name_case_insensitive_key" ON "CatalogSection" (lower("name")) WHERE "themeId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CatalogSection_themeId_name_case_insensitive_key" ON "CatalogSection" ("themeId", lower("name")) WHERE "themeId" IS NOT NULL;
