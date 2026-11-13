-- AlterTable
ALTER TABLE "Pack" ALTER COLUMN "themeId" SET DEFAULT '244b803a-63aa-460a-a40d-4eea0ec2be50';

-- CreateTable
CREATE TABLE "CatalogSection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "themeId" UUID,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CatalogSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogSectionPack" (
    "sectionId" UUID NOT NULL,
    "packId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CatalogSectionPack_pkey" PRIMARY KEY ("sectionId","packId")
);

-- CreateIndex
CREATE INDEX "CatalogSection_themeId_position_idx" ON "CatalogSection"("themeId", "position");

-- CreateIndex
CREATE INDEX "CatalogSectionPack_packId_idx" ON "CatalogSectionPack"("packId");

-- AddForeignKey
ALTER TABLE "CatalogSection" ADD CONSTRAINT "CatalogSection_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogSectionPack" ADD CONSTRAINT "CatalogSectionPack_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CatalogSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogSectionPack" ADD CONSTRAINT "CatalogSectionPack_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
