-- CreateTable
CREATE TABLE "CatalogSection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CatalogSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogSection_name_case_insensitive_key" ON "CatalogSection" (lower("name"));

-- InsertData
INSERT INTO "CatalogSection" ("id", "name", "position") VALUES
    ('9c3f6b1e-2d4a-4e8b-a7c5-1f0e9d8b7a63', 'Tous les packs', 0);
