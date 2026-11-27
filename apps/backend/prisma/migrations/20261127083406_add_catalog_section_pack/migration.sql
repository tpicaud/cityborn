-- CreateTable
CREATE TABLE "CatalogSectionPack" (
    "sectionId" UUID NOT NULL,
    "packId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CatalogSectionPack_pkey" PRIMARY KEY ("sectionId","packId")
);

-- CreateIndex
CREATE INDEX "CatalogSectionPack_packId_idx" ON "CatalogSectionPack"("packId");

-- AddForeignKey
ALTER TABLE "CatalogSectionPack" ADD CONSTRAINT "CatalogSectionPack_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CatalogSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogSectionPack" ADD CONSTRAINT "CatalogSectionPack_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
